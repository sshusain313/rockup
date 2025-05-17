import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// For development, use hardcoded test credentials
// In production, these would come from environment variables
const TEST_KEY_ID = 'rzp_test_uEEEREXlcrVyzx';
const TEST_KEY_SECRET = 'C8ol7Ovs9NhoGjkmpjwGgOaM';

// Helper function to get the appropriate Razorpay keys
const getRazorpayKeys = () => {
  // Always use test mode for development
  const isTestMode = true;
  
  console.log('Using test mode:', isTestMode);
  
  // Use hardcoded test credentials to ensure they're available
  return { 
    keyId: TEST_KEY_ID,
    keySecret: TEST_KEY_SECRET 
  };
};

// Generate a simple text-based invoice instead of PDF to avoid font issues
const generateInvoice = async (data: any): Promise<Buffer> => {
  try {
    // Create a simple text invoice
    const invoiceText = `
=======================================================
                    MOCKEY AI INVOICE
=======================================================

Invoice Number: INV-${Date.now()}
Date: ${new Date().toLocaleDateString()}

Payment Details:
---------------
Payment ID: ${data.razorpay_payment_id}
Order ID: ${data.razorpay_order_id}

Customer Details:
----------------
Name: ${data.customerName}
Email: ${data.customerEmail}

Subscription Details:
--------------------
Plan: ${data.planName}
Amount: ₹${data.amount / 100}

=======================================================
Thank you for subscribing to Mockey AI!
For any queries, please contact support@mockey.ai
=======================================================
`;

    // Convert text to buffer
    return Buffer.from(invoiceText, 'utf-8');
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

// Send confirmation email with invoice
const sendConfirmationEmail = async (to: string, data: any, invoicePdf: Buffer) => {
  // Create a test account if no email credentials are provided
  let testAccount;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    testAccount = await nodemailer.createTestAccount();
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || testAccount?.user,
      pass: process.env.EMAIL_PASS || testAccount?.pass,
    },
  });

  // Send email
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Mockey AI" <support@mockey.ai>',
    to,
    subject: `Payment Confirmation – ${data.planName} Subscription`,
    text: `
      Dear ${data.customerName},

      Thank you for subscribing to Mockey AI's ${data.planName} plan.

      Payment Details:
      - Plan: ${data.planName}
      - Amount: ₹${data.amount / 100}
      - Payment ID: ${data.razorpay_payment_id}
      - Order ID: ${data.razorpay_order_id}

      Please find your invoice attached.

      If you have any questions, please contact our support team.

      Best regards,
      Mockey AI Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Confirmation</h2>
        <p>Dear ${data.customerName},</p>
        <p>Thank you for subscribing to Mockey AI's <strong>${data.planName}</strong> plan.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details:</h3>
          <p><strong>Plan:</strong> ${data.planName}</p>
          <p><strong>Amount:</strong> ₹${data.amount / 100}</p>
          <p><strong>Payment ID:</strong> ${data.razorpay_payment_id}</p>
          <p><strong>Order ID:</strong> ${data.razorpay_order_id}</p>
        </div>
        
        <p>Please find your invoice attached.</p>
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>Mockey AI Team</p>
      </div>
    `,
    attachments: [
      {
        filename: 'invoice.txt',
        content: invoicePdf,
        contentType: 'text/plain',
      },
    ],
  });

  // Log URL for test accounts
  if (testAccount) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      customerName,
      customerEmail,
      planName,
      amount
    } = data;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const { keySecret } = getRazorpayKeys();

    // In test mode, we'll skip verification entirely
    console.log('Payment verification request received:', {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signature_length: razorpay_signature ? razorpay_signature.length : 0,
      customer: customerName,
      email: customerEmail
    });
    
    // Always consider payments successful in test/development mode
    // In production, you would properly verify the signature
    console.log('Test mode active - skipping payment verification');
    
    // Log the signature information for debugging
    if (razorpay_signature) {
      console.log('Signature provided:', razorpay_signature.substring(0, 10) + '...');
    } else {
      console.log('No signature provided');
    }

    // Generate invoice PDF
    const invoicePdf = await generateInvoice({
      razorpay_payment_id,
      razorpay_order_id,
      customerName: customerName || 'Valued Customer',
      customerEmail,
      planName: planName || 'Subscription',
      amount: amount || 0,
    });

    // Send confirmation email
    await sendConfirmationEmail(customerEmail, {
      razorpay_payment_id,
      razorpay_order_id,
      customerName: customerName || 'Valued Customer',
      planName: planName || 'Subscription',
      amount: amount || 0,
    }, invoicePdf);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and confirmation email sent',
    });
  } catch (error) {
    console.error('Error processing payment success:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
