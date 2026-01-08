// Resend email integration for Visit Dzaleka
import { Resend } from 'resend';

// Reply-to email addresses
const REPLY_TO_EMAILS = ['info@mail.dzaleka.com', 'dzalekaconnect@gmail.com'];

// Email send options
interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string[];
}

// Get Resend client using environment variables
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'booking@dzaleka.com';

  if (!apiKey) {
    console.error('RESEND_API_KEY environment variable is not set');
    return null;
  }

  return {
    client: new Resend(apiKey),
    fromEmail,
    replyTo: REPLY_TO_EMAILS
  };
}


// Send email with retry logic
async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const resendClient = getResendClient();

  if (!resendClient) {
    return { success: false, error: 'Email service not configured' };
  }

  const { client } = resendClient;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await client.emails.send(options);

      if (result.error) {
        console.error(`Email send attempt ${attempt}/${maxRetries} failed:`, result.error);

        if (attempt === maxRetries) {
          return {
            success: false,
            error: result.error.message || 'Unknown Resend API error'
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }

      console.log(`Email sent successfully to ${options.to} (attempt ${attempt})`);
      return { success: true, messageId: result.data?.id };

    } catch (error: any) {
      console.error(`Email send attempt ${attempt}/${maxRetries} exception:`, error?.message || error);

      if (attempt === maxRetries) {
        return {
          success: false,
          error: error?.message || 'Failed to send email'
        };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// Email templates
interface BookingConfirmationData {
  visitorName: string;
  visitorEmail: string;
  bookingReference: string;
  visitDate: string;
  visitTime: string;
  tourType: string;
  numberOfPeople: number;
  totalAmount: number;
  meetingPoint?: string;
}

interface StatusUpdateData {
  visitorName: string;
  visitorEmail: string;
  bookingReference: string;
  oldStatus: string;
  newStatus: string;
  visitDate: string;
  adminNotes?: string;
}

interface GuideAssignmentData {
  visitorName: string;
  visitorEmail: string;
  bookingReference: string;
  guideName: string;
  guidePhone: string;
  visitDate: string;
  visitTime: string;
  meetingPoint?: string;
}

interface PasswordResetData {
  userName: string;
  userEmail: string;
  resetToken: string;
  resetUrl: string;
}

interface CheckInNotificationData {
  visitorName: string;
  visitorEmail: string;
  bookingReference: string;
  checkInTime: string;
  guideName?: string;
}

interface InvitationData {
  email: string;
  role: string;
  inviteUrl: string;
  inviterName?: string;
}

// Send user invitation email
export async function sendInvitationEmail(data: InvitationData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284C7 0%, #0369a1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Visit Dzaleka</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">You've Been Invited!</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hello,</p>
            <p>You have been invited to join the Visit Dzaleka platform as a <strong>${data.role}</strong>.</p>
            
            ${data.inviterName ? `<p>Invitation sent by: <strong>${data.inviterName}</strong></p>` : ''}
            
            <p>Please click the button below to accept your invitation and set up your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.inviteUrl}" style="display: inline-block; background: #0284C7; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              This link is valid for 24 hours. If you were not expecting this invitation, please ignore this email.
            </p>
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Dzaleka Online Services
            </p>
          </div>
        </body>
      </html>
    `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.email,
    subject: 'You have been invited to Visit Dzaleka',
    html
  });

  return result.success;
}

// Format currency for email display
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Send booking confirmation email
export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0284C7 0%, #0369a1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Visit Dzaleka</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Booking Confirmation</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0 0 20px 0;">Dear ${data.visitorName},</p>
          
          <p>Thank you for booking a visit to Dzaleka Refugee Camp. Your booking has been received and is pending confirmation.</p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #0284C7; margin: 0 0 15px 0; font-size: 18px;">Booking Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Reference:</td>
                <td style="padding: 8px 0; font-weight: 600;">${data.bookingReference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Date:</td>
                <td style="padding: 8px 0;">${data.visitDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Time:</td>
                <td style="padding: 8px 0;">${data.visitTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Tour Type:</td>
                <td style="padding: 8px 0; text-transform: capitalize;">${data.tourType.replace('_', ' ')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Group Size:</td>
                <td style="padding: 8px 0;">${data.numberOfPeople} ${data.numberOfPeople === 1 ? 'person' : 'people'}</td>
              </tr>
              ${data.meetingPoint ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Meeting Point:</td>
                <td style="padding: 8px 0;">${data.meetingPoint}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 15px 0 8px 0; color: #6b7280;">Total Amount:</td>
                <td style="padding: 15px 0 8px 0; font-weight: 700; font-size: 18px; color: #0284C7;">${formatCurrency(data.totalAmount)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Next Steps:</strong> Our team will review your booking and send you a confirmation email with your assigned guide details within 24 hours.
            </p>
          </div>
          
          <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
            If you have any questions, please contact us at visit@dzaleka.com
          </p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} Dzaleka Online Services
          </p>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.visitorEmail,
    subject: `Booking Confirmation - ${data.bookingReference}`,
    html
  });

  return result.success;
}

// Send status update email
export async function sendStatusUpdate(data: StatusUpdateData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    confirmed: {
      title: 'Booking Confirmed!',
      message: 'Great news! Your booking has been confirmed. Please arrive at the designated meeting point on time.',
      color: '#10b981'
    },
    completed: {
      title: 'Tour Completed',
      message: 'Thank you for taking a tour with Visit Dzaleka. We hope you had a meaningful and inspiring experience.',
      color: '#3b82f6'
    },
    cancelled: {
      title: 'Booking Cancelled',
      message: 'Your booking has been cancelled. If you have any questions, please contact us.',
      color: '#ef4444'
    }
  };

  const statusInfo = statusMessages[data.newStatus] || {
    title: 'Booking Status Update',
    message: `Your booking status has been updated to: ${data.newStatus}`,
    color: '#6b7280'
  };

  // Special HTML for completed tours with feedback request
  const completedTourContent = data.newStatus === 'completed' ? `
            <p style="margin-top: 20px;">We'd appreciate it if you could share your thoughts and feelings about your visit. You can either reply to this email or complete our quick feedback form:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://services.dzaleka.com/visit/feedback" 
                 style="display: inline-block; background: #0284C7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Share Your Feedback
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Your feedback helps us improve, and with your permission, we'd love to share your comments on our website to inspire future visitors.
            </p>
            
            <p style="margin-top: 20px;">If you have any photos or stories you'd like to share, feel free to include them in your reply or tag us on Instagram at <strong>@dzalekaonline</strong> and <strong>@visitdzaleka</strong>.</p>
            
            <p style="margin-top: 20px;">Thank you again for spending your time with our community. We look forward to welcoming you back in the future.</p>
  ` : '';

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284C7 0%, #0369a1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Visit Dzaleka</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="display: inline-block; background: ${statusInfo.color}; color: white; padding: 10px 25px; border-radius: 25px; font-weight: 600;">
                ${statusInfo.title}
              </div>
            </div>
            
            <p>Dear ${data.visitorName},</p>
            <p>${statusInfo.message}</p>
            
            ${completedTourContent}
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Reference:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${data.bookingReference}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Visit Date:</td>
                  <td style="padding: 8px 0;">${data.visitDate}</td>
                </tr>
              </table>
            </div>
            
            ${data.adminNotes ? `
            <div style="background: #f0f9ff; border: 1px solid #0284C7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #0369a1; font-size: 14px;">
                <strong>Note from Admin:</strong><br>${data.adminNotes}
              </p>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 14px;">
              Kind regards,<br><strong>Dzaleka Online Services</strong>
            </p>
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Dzaleka Online Services
            </p>
          </div>
        </body>
      </html>
    `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.visitorEmail,
    subject: `${statusInfo.title} - ${data.bookingReference}`,
    html
  });

  return result.success;
}

// Send guide assignment notification
export async function sendGuideAssignment(data: GuideAssignmentData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284C7 0%, #0369a1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Visit Dzaleka</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Guide Assigned</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Dear ${data.visitorName},</p>
            <p>A guide has been assigned to your upcoming visit to Dzaleka Refugee Camp.</p>
            
            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 15px 0;">Your Guide</h3>
              <p style="margin: 0; font-size: 18px; font-weight: 600;">${data.guideName}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Phone: ${data.guidePhone}</p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0284C7; margin: 0 0 15px 0;">Visit Details</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Reference:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${data.bookingReference}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Date:</td>
                  <td style="padding: 8px 0;">${data.visitDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Time:</td>
                  <td style="padding: 8px 0;">${data.visitTime}</td>
                </tr>
                ${data.meetingPoint ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Meeting Point:</td>
                  <td style="padding: 8px 0;">${data.meetingPoint}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              Please arrive at the meeting point 10 minutes before your scheduled time. Your guide will be waiting for you.
            </p>
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Dzaleka Online Services
            </p>
          </div>
        </body>
      </html>
    `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.visitorEmail,
    subject: `Guide Assigned - ${data.bookingReference}`,
    html
  });

  return result.success;
}

// Send check-in notification
export async function sendCheckInNotification(data: CheckInNotificationData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Dzaleka!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Check-In Confirmed</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Dear ${data.visitorName},</p>
            <p>You have successfully checked in for your visit to Dzaleka Refugee Camp.</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Reference:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${data.bookingReference}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Check-In Time:</td>
                  <td style="padding: 8px 0;">${data.checkInTime}</td>
                </tr>
                ${data.guideName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Your Guide:</td>
                  <td style="padding: 8px 0;">${data.guideName}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Important:</strong> Please follow your guide's instructions and respect community guidelines during your visit.
              </p>
            </div>
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Dzaleka Online Services
            </p>
          </div>
        </body>
      </html>
    `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.visitorEmail,
    subject: `Check-In Confirmed - ${data.bookingReference}`,
    html
  });

  return result.success;
}

// Custom email from admin
interface CustomEmailData {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  senderName?: string;
}

export async function sendCustomEmail(data: CustomEmailData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284C7 0%, #0369a1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Visit Dzaleka</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Dear ${data.recipientName},</p>
            
            <div style="white-space: pre-wrap; margin: 20px 0;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            
            ${data.senderName ? `
            <p style="margin-top: 30px; color: #6b7280;">
              Best regards,<br>
              <strong>${data.senderName}</strong><br>
              Visit Dzaleka Team
            </p>
            ` : ''}
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Dzaleka Online Services
            </p>
          </div>
        </body>
      </html>
    `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.recipientEmail,
    subject: data.subject,
    html
  });

  return result.success;
}

// Send password reset email
export async function sendPasswordReset(data: PasswordResetData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284C7 0%, #0369a1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Visit Dzaleka</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Dear ${data.userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="display: inline-block; background: #0284C7; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
            
            <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Security Notice:</strong> Never share your password or this reset link with anyone.
              </p>
            </div>
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Dzaleka Online Services
            </p>
          </div>
        </body>
      </html>
    `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.userEmail,
    subject: 'Password Reset Request - Visit Dzaleka',
    html
  });

  return result.success;
}
// Send itinerary email
interface ItineraryItem {
  time: string;
  activity: string;
}

interface ItineraryData {
  recipientEmail: string;
  recipientName: string;
  date: string;
  duration: string;
  items: ItineraryItem[];
  totalCost?: string;
  notes?: string;
  guideName?: string;
  guideContact?: string;
  senderName?: string;
  pois?: string[];
  bookingReference?: string;
}

export async function sendItineraryEmail(data: ItineraryData): Promise<boolean> {
  const resendClient = getResendClient();
  if (!resendClient) return false;

  const timelineHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px 0; width: 90px; font-weight: 600; vertical-align: top; color: #0284C7; font-size: 15px;">${item.time}</td>
      <td style="padding: 12px 0; vertical-align: top; color: #334155;">${item.activity}</td>
    </tr>
  `).join('');

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="background: linear-gradient(135deg, #0284C7 0%, #0369a1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Visit Dzaleka</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; letter-spacing: 0.5px;">CURATED ITINERARY</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; margin-bottom: 25px;">Dear ${data.recipientName},</p>
              
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">
                We are delighted to present your personalized itinerary for <strong>${data.date}</strong>. 
                Our team has carefully designed this schedule to ensure you have a meaningful and insightful experience at Dzaleka.
              </p>

              ${data.bookingReference ? `
              <div style="background: #f8fafc; border-left: 4px solid #0284C7; padding: 15px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">Booking Reference</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 700; color: #0f172a;">${data.bookingReference}</p>
              </div>
              ` : ''}
              
              <div style="margin-bottom: 35px;">
                <h3 style="color: #0f172a; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Your Journey</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${timelineHtml}
                </table>
              </div>

              ${data.pois && data.pois.length > 0 ? `
              <div style="margin-bottom: 35px;">
                <h3 style="color: #0f172a; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Experience Highlights</h3>
                <ul style="padding-left: 20px; color: #4b5563;">
                  ${data.pois.map(poi => `<li style="margin-bottom: 8px;">${poi}</li>`).join('')}
                </ul>
              </div>
              ` : ''}

              <div style="background: #f8fafc; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 15px 0;">Trip Details</h3>
                
                ${data.totalCost ? `
                <div style="margin-bottom: 15px;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">Estimated Cost</p>
                  <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 600; color: #0f172a;">${data.totalCost}</p>
                  <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Payment collected upon arrival (Cash).</p>
                </div>
                ` : ''}

                ${data.guideName ? `
                <div>
                  <p style="margin: 0; font-size: 14px; color: #64748b;">Your Expert Guide</p>
                  <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 600; color: #0f172a;">${data.guideName}</p>
                  ${data.guideContact ? `<p style="margin: 2px 0 0 0; font-size: 14px; color: #4b5563;">${data.guideContact}</p>` : ''}
                </div>
                ` : ''}
              </div>

              ${data.notes ? `
              <div style="background: #fff7ed; border-radius: 8px; padding: 20px; margin-bottom: 35px; border: 1px solid #fed7aa;">
                <h4 style="margin: 0 0 10px 0; color: #9a3412; font-size: 16px;">Important Info</h4>
                <p style="margin: 0; font-size: 14px; color: #431407;">${data.notes.replace(/\n/g, '<br>')}</p>
              </div>
              ` : ''}

              <div style="background: #0f172a; color: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
                <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Before You Visit</h3>
                <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.9;">Please review our guidelines to ensure a respectful and prepared visit.</p>
                <div style="margin-bottom: 15px;">
                    <a href="https://services.dzaleka.com/visit/travel-guide/" style="display: inline-block; background: #0284C7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: 600; margin: 0 5px;">Travel Guide</a>
                </div>
                <div>
                    <a href="https://services.dzaleka.com/visit/guidelines/" style="color: #60a5fa; text-decoration: none; font-size: 14px;">View Visitor Guidelines &rarr;</a>
                </div>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 40px; text-align: center; color: #64748b; font-size: 14px;">
                <p style="margin: 0 0 5px 0;">Warm regards,</p>
                <p style="margin: 0; font-weight: 600;">${data.senderName || 'The Visit Dzaleka Team'}</p>
              </div>

            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Dzaleka Online Services</p>
          </div>
        </body>
      </html>
    `;

  const result = await sendEmailWithRetry({
    from: resendClient.fromEmail,
    replyTo: resendClient.replyTo,
    to: data.recipientEmail,
    subject: `Your Curation - Visit Dzaleka`,
    html
  });

  return result.success;
}
