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
      console.warn('SMTP configuration is missing or incomplete. Preview fallback active.');
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
  if (!mailTransporter) {
    console.log(`[SMTP SIMULATION] Sent to: ${to} | Subject: "${subject}"`);
    return { messageId: `mock-${Date.now()}` };
  }

  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@swiftcart.com';

  try {
    const info = await mailTransporter.sendMail({
      from: `"SwiftCart" <${from}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email successfully sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function generateOrderConfirmationEmail(order: any, items: any[] = []) {
  const orderId = order.id || 'N/A';
  const customerName = order.customer_name || 'Customer';
  const total = typeof order.total === 'number' ? `$${order.total.toFixed(2)}` : (order.total || '$0.00');
  const subtotal = typeof order.subtotal === 'number' ? `$${order.subtotal.toFixed(2)}` : (order.subtotal || total);
  const shippingCost = typeof order.shipping_cost === 'number' ? `$${order.shipping_cost.toFixed(2)}` : (order.shipping_cost || '$0.00');
  const paymentMethod = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card';
  const address = order.address || 'Standard Address';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/track-order/${orderId}`;
  const invoiceUrl = `${appUrl}/invoice/${orderId}`;

  const resolvedItems = items.length > 0 ? items : (order.items || [
    { name: order.product_name || 'Store Item', quantity: 1, price: order.product_price || order.total || 0 }
  ]);

  const subject = `Order Confirmation & Receipt - #${orderId}`;
  
  const textItems = resolvedItems
    .map((item: any) => `- ${item.quantity || 1}x ${item.name} ($${Number(item.price || 0).toFixed(2)})`)
    .join('\n');

  const text = `Hi ${customerName},

Thank you for shopping with SwiftCart! We've received your order #${orderId} and are getting it ready.

Order Summary:
${textItems}

Subtotal: ${subtotal}
Shipping: ${shippingCost}
Total Paid/Due: ${total}
Payment Method: ${paymentMethod}
Delivery Address: ${address}

Track your order anytime: ${trackingUrl}
View printable invoice: ${invoiceUrl}

Best regards,
The SwiftCart Support Team`;

  const itemsHtml = resolvedItems.map((item: any) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 12px 0; font-size: 14px; color: #111827;">
        <strong>${item.name}</strong>
        ${item.attributes ? `<br/><span style="font-size: 12px; color: #6b7280;">${item.attributes}</span>` : ''}
      </td>
      <td style="padding: 12px 8px; text-align: center; font-size: 14px; color: #4b5563;">${item.quantity || 1}</td>
      <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 600; color: #111827;">$${Number(item.price || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation #${orderId}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        
        <!-- Brand Header -->
        <div style="background-color: #4f46e5; padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SwiftCart</h1>
          <p style="margin: 0; font-size: 15px; opacity: 0.9;">Order Receipt & Confirmation</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">Thank You for Your Order, ${customerName}!</h2>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
            We're preparing your package for shipment. Here is a full summary of your transaction and order details.
          </p>

          <!-- Order Info Box -->
          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #374151; margin-bottom: 6px;">
              <span><strong>Order ID:</strong> #${orderId}</span>
              <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
            </div>
            <div style="font-size: 13px; color: #374151; margin-bottom: 6px;">
              <strong>Payment Method:</strong> ${paymentMethod}
            </div>
            <div style="font-size: 13px; color: #374151;">
              <strong>Delivery Address:</strong> ${address}
            </div>
          </div>

          <!-- Items Table -->
          <h3 style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 12px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 1px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280;">
                <th style="text-align: left; padding-bottom: 8px;">Product</th>
                <th style="text-align: center; padding-bottom: 8px;">Qty</th>
                <th style="text-align: right; padding-bottom: 8px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 4px;">
              <span>Subtotal:</span>
              <span>${subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 6px;">
              <span>Shipping Fee:</span>
              <span>${shippingCost}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #4f46e5; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              <span>Total Amount:</span>
              <span>${total}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${trackingUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; margin-right: 8px; margin-bottom: 8px;">
              Track My Order
            </a>
            <a href="${invoiceUrl}" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 14px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 12px; border: 1px solid #d1d5db; margin-bottom: 8px;">
              Download Invoice
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0 0 6px 0;">Need assistance with this order? Contact support@swiftcart.com</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} SwiftCart Inc. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

export function generatePriceAlertConfirmationEmail(alertData: any, product: any) {
  const productName = product?.name || alertData.product_name || 'Product';
  const targetPrice = typeof alertData.target_price === 'number' ? `$${alertData.target_price.toFixed(2)}` : `$${alertData.target_price}`;
  const currentPrice = typeof alertData.current_price === 'number' ? `$${alertData.current_price.toFixed(2)}` : `$${alertData.current_price}`;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const productUrl = `${appUrl}/product/${alertData.product_id}`;

  const subject = `Price Drop Alert Activated for ${productName}`;
  const text = `Hi,

Your price drop alert for "${productName}" is active!

- Current Price: ${currentPrice}
- Target Price: ${alertData.alert_type === 'any' ? 'Any Price Drop' : targetPrice}

We will notify you immediately via email the moment this item's price is discounted.

View product: ${productUrl}

Best regards,
SwiftCart Alerts`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; background-color: #fef3c7; color: #d97706; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
          🔔 Price Alert Activated
        </span>
      </div>
      <h2 style="color: #111827; text-align: center; margin: 0 0 12px 0;">You're All Set!</h2>
      <p style="color: #4b5563; font-size: 14px; text-align: center; line-height: 1.6; margin: 0 0 20px 0;">
        We are tracking <strong>${productName}</strong> for you. As soon as the price drops to or below your target, we will send an instant notification to this email address.
      </p>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
          <span style="color: #64748b;">Current Price:</span>
          <span style="font-weight: 700; color: #0f172a;">${currentPrice}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <span style="color: #64748b;">Alert Trigger:</span>
          <span style="font-weight: 700; color: #4f46e5;">${alertData.alert_type === 'any' ? 'Any Price Drop' : `At or below ${targetPrice}`}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${productUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">
          View Product in Store
        </a>
      </div>
      <p style="margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        SwiftCart Price Watcher &bull; Auto-triggered notifications
      </p>
    </div>
  `;

  return { subject, text, html };
}

export function generateShippingUpdateEmail(order: any, status: string) {
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmed & Packed',
    shipped: 'Shipped & In Transit',
    delivered: 'Delivered'
  };

  const statusLabel = statusLabels[status] || status.toUpperCase();
  const subject = `Shipment Update - Order #${order.id} is now ${statusLabel}`;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/track-order/${order.id}`;

  const text = `Hi ${order.customer_name || 'Customer'},

Good news! Your order #${order.id} status has been updated to: ${statusLabel}.

Track your shipment progress live: ${trackingUrl}

Best regards,
The SwiftCart Logistics Team`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin: 0 0 12px 0;">Shipment Update</h2>
      <p style="font-size: 14px; color: #374151;">Hi <strong>${order.customer_name || 'Customer'}</strong>,</p>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        Your order <strong>#${order.id}</strong> has progressed to: <strong style="color: #4f46e5; font-size: 16px;">${statusLabel}</strong>.
      </p>
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #f3f4f6;">
        <p style="margin: 4px 0; font-size: 13px;"><strong>Order ID:</strong> #${order.id}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Current Status:</strong> ${statusLabel}</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">
          Track Live Progress
        </a>
      </div>
      <p style="margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
        Thank you for choosing SwiftCart!
      </p>
    </div>
  `;

  return { subject, text, html };
}
