import { useEffect } from 'react';

/**
 * Hook to warn users about unsaved changes before leaving the page.
 * Shows a browser confirmation dialog if there are unsaved changes.
 * 
 * @param hasUnsavedChanges - Whether there are unsaved changes
 * @param message - Optional custom message (note: most browsers ignore custom messages)
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean, message?: string) {
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // Modern browsers ignore this message and show a generic one
            e.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, message]);
}
