import { NextResponse } from 'next/server';

export async function GET() {
  // Log all environment variables for debugging
  console.log('Environment Variables:');
  console.log('MONGODB_URL:', process.env.MONGODB_URL);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);
  console.log('AUTH_SECRET:', process.env.AUTH_SECRET);
  
  // Log Razorpay environment variables
  console.log('RAZORPAY_ENV:', process.env.RAZORPAY_ENV);
  console.log('RAZORPAY_KEY_ID_TEST:', process.env.RAZORPAY_KEY_ID_TEST);
  console.log('RAZORPAY_KEY_SECRET_TEST:', process.env.RAZORPAY_KEY_SECRET_TEST);
  
  return NextResponse.json({
    mongodb_url: process.env.MONGODB_URL ? 'defined' : 'undefined',
    nextauth_url: process.env.NEXTAUTH_URL,
    auth_secret: process.env.AUTH_SECRET ? 'defined' : 'undefined',
    razorpay_env: process.env.RAZORPAY_ENV,
    razorpay_key_id_test: process.env.RAZORPAY_KEY_ID_TEST ? 'defined' : 'undefined',
    razorpay_key_secret_test: process.env.RAZORPAY_KEY_SECRET_TEST ? 'defined' : 'undefined',
  });
}
