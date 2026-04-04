import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP configuration is missing. Emails will not be sent.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  try {
    const info = await mailTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function generateOrderConfirmationEmail(order: any, product: any) {
  const subject = `Order Confirmation - #${order.id}`;
  const text = `Hi ${order.customer_name},\n\nThank you for your order! Your order for ${product.name} has been received and is being processed.\n\nOrder ID: #${order.id}\nEstimated Delivery: ${new Date(order.estimated_delivery).toLocaleDateString()}\n\nYou can track your order here: ${process.env.APP_URL}/track-order/${order.id}\n\nBest regards,\nPremium Essentials Team`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4f46e5;">Order Confirmation</h2>
      <p>Hi <strong>${order.customer_name}</strong>,</p>
      <p>Thank you for your order! Your order for <strong>${product.name}</strong> has been received and is being processed.</p>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
        <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${new Date(order.estimated_delivery).toLocaleDateString()}</p>
      </div>
      <p>You can track your order status anytime by clicking the button below:</p>
      <a href="${process.env.APP_URL}/track-order/${order.id}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Track Your Order</a>
      <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #6b7280;">
        Best regards,<br>
        Premium Essentials Team
      </p>
    </div>
  `;

  return { subject, text, html };
}

export function generateShippingUpdateEmail(order: any, status: string) {
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered'
  };

  const statusLabel = statusLabels[status] || status.toUpperCase();
  const subject = `Shipping Update - Order #${order.id} is now ${statusLabel}`;
  const text = `Hi ${order.customer_name},\n\nGood news! Your order status has been updated to: ${statusLabel}.\n\nOrder ID: #${order.id}\n\nYou can track your order here: ${process.env.APP_URL}/track-order/${order.id}\n\nBest regards,\nPremium Essentials Team`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4f46e5;">Shipping Update</h2>
      <p>Hi <strong>${order.customer_name}</strong>,</p>
      <p>Good news! Your order status has been updated to: <strong style="color: #4f46e5;">${statusLabel}</strong>.</p>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
        <p style="margin: 5px 0;"><strong>New Status:</strong> ${statusLabel}</p>
      </div>
      <p>You can track your order status anytime by clicking the button below:</p>
      <a href="${process.env.APP_URL}/track-order/${order.id}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Track Your Order</a>
      <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #6b7280;">
        Best regards,<br>
        Premium Essentials Team
      </p>
    </div>
  `;

  return { subject, text, html };
}
