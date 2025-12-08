import { useEffect, useRef } from 'react';
import { supabase, isRealtimeEnabled } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
    onNewBooking?: (booking: any) => void;
    onNewTask?: (task: any) => void;
    onNotification?: (notification: any) => void;
}

export function useRealtimeSubscriptions(options: RealtimeOptions = {}) {
    const { user } = useAuth();
    const { toast } = useToast();
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!isRealtimeEnabled || !supabase || !user) {
            return;
        }

        // Create a channel for all subscriptions
        const channel = supabase
            .channel('app-realtime')
            // Listen for new bookings (admin/coordinator only)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bookings' },
                (payload) => {
                    console.log('New booking received:', payload);

                    if (user.role === 'admin' || user.role === 'coordinator') {
                        // Invalidate booking queries to refresh data
                        queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

                        // Show toast notification
                        toast({
                            title: '🎫 New Booking',
                            description: 'A new booking request has been submitted.',
                        });

                        options.onNewBooking?.(payload.new);
                    }
                }
            )
            // Listen for new tasks assigned to current user
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tasks' },
                (payload) => {
                    console.log('New task received:', payload);
                    const newTask = payload.new as any;

                    // Invalidate task queries
                    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

                    // If task is assigned to current user, show notification
                    if (newTask.assigned_to === user.id) {
                        toast({
                            title: '📋 New Task Assigned',
                            description: newTask.title || 'You have been assigned a new task.',
                        });
                    }

                    options.onNewTask?.(payload.new);
                }
            )
            // Listen for task updates
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'tasks' },
                (payload) => {
                    console.log('Task updated:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                }
            )
            // Listen for booking status changes
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'bookings' },
                (payload) => {
                    console.log('Booking updated:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
                }
            )
            // Listen for new notifications
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    console.log('New notification:', payload);
                    const notification = payload.new as any;

                    // If notification is for current user
                    if (notification.user_id === user.id) {
                        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });

                        toast({
                            title: '🔔 Notification',
                            description: notification.message || 'You have a new notification.',
                        });

                        options.onNotification?.(payload.new);
                    }
                }
            )
            // Listen for new task comments
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'task_comments' },
                (payload) => {
                    console.log('New task comment:', payload);
                    const comment = payload.new as any;

                    // Invalidate task comments query
                    queryClient.invalidateQueries({ queryKey: [`/api/tasks/${comment.task_id}/comments`] });
                    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

                    toast({
                        title: '💬 New Comment',
                        description: 'Someone commented on a task.',
                    });
                }
            )
            // Listen for payment/revenue updates
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments' },
                (payload) => {
                    console.log('Payment update:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/revenue'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

                    if (payload.eventType === 'INSERT' && (user.role === 'admin' || user.role === 'coordinator')) {
                        toast({
                            title: '💰 New Payment',
                            description: 'A new payment has been received.',
                        });
                    }
                }
            )
            // Listen for check-in updates (security)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                (payload) => {
                    console.log('Check-in update:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });

                    if (user.role === 'security' || user.role === 'admin') {
                        const checkIn = payload.new as any;
                        toast({
                            title: checkIn.checked_out_at ? '👋 Visitor Checked Out' : '✅ Visitor Checked In',
                            description: 'A visitor check-in status has changed.',
                        });
                    }
                }
            )
            // Listen for guide availability changes
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'guides' },
                (payload) => {
                    console.log('Guide update:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/guides'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
                }
            );

        // Subscribe to the channel
        channel.subscribe((status) => {
            console.log('Realtime subscription status:', status);
        });

        channelRef.current = channel;

        // Cleanup on unmount
        return () => {
            if (channelRef.current && supabase) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user, options.onNewBooking, options.onNewTask, options.onNotification, toast]);

    return {
        isEnabled: isRealtimeEnabled,
        channel: channelRef.current,
    };
}

// Hook specifically for dashboard stats real-time updates
export function useDashboardRealtime() {
    useEffect(() => {
        if (!isRealtimeEnabled || !supabase) {
            return;
        }

        const channel = supabase
            .channel('dashboard-stats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/stats/weekly'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/stats/zones'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/stats/guide-performance'] });
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, []);
}

// Hook for live calendar updates
export function useCalendarRealtime() {
    const { toast } = useToast();

    useEffect(() => {
        if (!isRealtimeEnabled || !supabase) {
            return;
        }

        const channel = supabase
            .channel('calendar-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings' },
                (payload) => {
                    console.log('Calendar booking change:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });

                    if (payload.eventType === 'INSERT') {
                        toast({
                            title: '📅 New Booking',
                            description: 'A new booking has been added to the calendar.',
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'guides' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['/api/guides'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [toast]);
}

// Hook for live revenue updates
export function useRevenueRealtime() {
    const { toast } = useToast();

    useEffect(() => {
        if (!isRealtimeEnabled || !supabase) {
            return;
        }

        const channel = supabase
            .channel('revenue-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments' },
                (payload) => {
                    console.log('Revenue payment change:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/revenue'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/revenue/summary'] });

                    if (payload.eventType === 'INSERT') {
                        const payment = payload.new as any;
                        toast({
                            title: '💵 Payment Received',
                            description: payment.amount ? `$${payment.amount} received` : 'New payment recorded.',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [toast]);
}

// Hook for security check-in live updates
export function useCheckInRealtime() {
    const { toast } = useToast();

    useEffect(() => {
        if (!isRealtimeEnabled || !supabase) {
            return;
        }

        const channel = supabase
            .channel('checkin-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                (payload) => {
                    console.log('Check-in change:', payload);
                    queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });

                    const checkIn = payload.new as any;
                    if (payload.eventType === 'INSERT') {
                        toast({
                            title: '✅ Visitor Checked In',
                            description: 'A visitor has checked in.',
                        });
                    } else if (checkIn?.checked_out_at) {
                        toast({
                            title: '👋 Visitor Checked Out',
                            description: 'A visitor has checked out.',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [toast]);
}
