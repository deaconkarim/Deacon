import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      donation_id, 
      donor_name, 
      donor_email, 
      amount, 
      fund_designation, 
      payment_method, 
      notes 
    } = req.body;

    if (!donor_email) {
      return res.status(400).json({ error: 'Donor email is required' });
    }

    const fundLabels = {
      general: 'General Fund',
      tithes: 'Tithes',
      building: 'Building Fund',
      missions: 'Missions',
      youth: 'Youth Ministry'
    };

    const fundLabel = fundLabels[fund_designation] || fund_designation;
    const paymentMethodLabel = payment_method === 'card' ? 'Credit Card' : 'Bank Transfer';

    // Send confirmation email
    const { data, error } = await resend.emails.send({
      from: 'donations@yourchurch.com',
      to: donor_email,
      subject: `Thank you for your donation - Receipt #${donation_id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Donation Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .receipt { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .receipt-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Donation</h1>
              <p>Your generosity helps us continue our mission</p>
            </div>
            
            <div class="content">
              <p>Dear ${donor_name},</p>
              
              <p>Thank you for your generous donation to our church. Your support enables us to continue serving our community and spreading God's love.</p>
              
              <div class="receipt">
                <h2>Donation Receipt</h2>
                <div class="receipt-row">
                  <strong>Receipt Number:</strong>
                  <span>#${donation_id}</span>
                </div>
                <div class="receipt-row">
                  <strong>Date:</strong>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                <div class="receipt-row">
                  <strong>Amount:</strong>
                  <span class="amount">$${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div class="receipt-row">
                  <strong>Fund:</strong>
                  <span>${fundLabel}</span>
                </div>
                <div class="receipt-row">
                  <strong>Payment Method:</strong>
                  <span>${paymentMethodLabel}</span>
                </div>
                ${notes ? `
                <div class="receipt-row">
                  <strong>Notes:</strong>
                  <span>${notes}</span>
                </div>
                ` : ''}
              </div>
              
              <p>This receipt serves as your tax-deductible donation record. Please keep it for your records.</p>
              
              <p>If you have any questions about your donation, please don't hesitate to contact us.</p>
              
              <p>Blessings,<br>The Church Team</p>
            </div>
            
            <div class="footer">
              <p>Thank you for your continued support of our ministry.</p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="button">Visit Our Website</a>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Email sending error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Also send notification to church admin
    await resend.emails.send({
      from: 'donations@yourchurch.com',
      to: process.env.CHURCH_ADMIN_EMAIL,
      subject: `New Donation Received - $${parseFloat(amount).toFixed(2)}`,
      html: `
        <h2>New Donation Received</h2>
        <p><strong>Amount:</strong> $${parseFloat(amount).toFixed(2)}</p>
        <p><strong>Fund:</strong> ${fundLabel}</p>
        <p><strong>Donor:</strong> ${donor_name}</p>
        <p><strong>Email:</strong> ${donor_email}</p>
        <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
        <p><strong>Receipt ID:</strong> #${donation_id}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      `
    });

    res.status(200).json({ 
      success: true, 
      message: 'Confirmation email sent successfully' 
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      error: 'Failed to send confirmation email',
      details: error.message 
    });
  }
}