
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailHost || !emailUser || !emailPass) {
    console.warn('⚠️  Email not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS environment variables.');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort || '587'),
      secure: emailPort === '465',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  return transporter;
}

export interface ReservationEmailData {
  itemName: string;
  userName: string;
  userEmail: string;
  startDate: string;
  returnDate: string;
  notes?: string;
}

export async function sendReservationRequestEmail(
  adminEmail: string,
  data: ReservationEmailData
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: 'New Reservation Request - Inventory Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">New Reservation Request</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 10px 0;"><strong>User:</strong> ${data.userName}</p>
            <p style="margin: 10px 0;"><strong>Dates:</strong> ${data.startDate} to ${data.returnDate}</p>
            ${data.notes ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
          </div>
          <p>Please log in to the inventory system to review this request.</p>
          <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Review Request
          </a>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Reservation request email sent to ${adminEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send reservation request email:', error);
    return false;
  }
}

export async function sendReservationApprovedEmail(
  userEmail: string,
  data: ReservationEmailData
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Reservation Approved - Inventory Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Reservation Approved! ✅</h2>
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 10px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 10px 0;"><strong>Reserved Dates:</strong> ${data.startDate} to ${data.returnDate}</p>
          </div>
          <p>Your reservation request has been approved! You can pick up the item on the start date.</p>
          <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            View Reservation
          </a>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send approval email:', error);
    return false;
  }
}

export async function sendReservationRejectedEmail(
  userEmail: string,
  data: ReservationEmailData & { rejectionReason?: string }
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Reservation Declined - Inventory Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Reservation Declined</h2>
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 10px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 10px 0;"><strong>Requested Dates:</strong> ${data.startDate} to ${data.returnDate}</p>
            ${data.rejectionReason ? `<p style="margin: 10px 0;"><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
          </div>
          <p>Unfortunately, your reservation request has been declined. Please contact the administrator for more information or submit a new request for different dates.</p>
          <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Make New Request
          </a>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send rejection email:', error);
    return false;
  }
}
