'use client';

import { CheckCircle, CircleCheckBig } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PricingTable from './components/PricingTable';
import Enterprise from './components/Enterprise';
import Plans from './components/Plans';
import Tweets from './components/Tweets';
import Credits from './components/Credits';
import Faqs from './components/Faqs';
import GetStarted from './components/GetStarted';

// Add TypeScript declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Define subscription plans with INR pricing
const PLANS = [
  {
    name: 'BASIC',
    icon: '🆓',
    price: '₹0/mo',
    amountInr: 0,
    oldPrice: null,
    subtext: 'No Billing',
    features: [
      '1000+ Free Mockups',
      'New Mockups Every Week',
      'JPG File Format',
    ],
    button: 'Free Forever',
    highlight: false,
    bg: 'bg-white',
  },
  {
    name: 'PRO',
    icon: '🟠',
    price: '₹349/mo',
    amountInr: 349,
    oldPrice: '₹599/mo',
    subtext: 'Billed yearly',
    features: [
      'Everything in BASIC +',
      'PNG File Format',
      'PRO Mockups',
      'High Quality Download',
      'Mockup Bundles',
      'Multiple Design Upload',
      'Exclusive Backgrounds',
      'No Ads',
      'Unlimited Downloads',
    ],
    button: 'Subscribe to PRO',
    highlight: 'Most Popular',
    bg: 'bg-white',
  },
  {
    name: 'ENTERPRISE',
    icon: '🟣',
    price: '₹1299/mo',
    amountInr: 1299,
    oldPrice: '₹1599/mo',
    subtext: 'Billed yearly',
    features: [
      'Everything in PRO +',
      '200 AI Credits',
      'AI Animate',
      'AI Photoshoot',
      'AI Background Remover',
      'AI Background Blur',
    ],
    button: 'Subscribe to ENTERPRISE',
    highlight: false,
    bg: 'bg-white',
  },
  {
    name: 'LIFETIME PRO',
    icon: '💎',
    price: '₹14999',
    amountInr: 14999,
    oldPrice: null,
    subtext: 'One Time\nBuy once, use forever',
    features: [
      'Everything in PRO +',
      'Use Forever',
      'Lifetime Updates',
      'Priority Support',
    ],
    button: 'Get Lifetime PRO',
    highlight: false,
    bg: 'bg-gradient-to-b from-[#3b82f6] to-[#0f172a] text-white',
    isLifetime: true,
  },
];

export default function Pricing() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
  });

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Separate effect for script loading to avoid cleanup issues
  useEffect(() => {
    // Only run on client
    if (!isClient) return;
    
    // Function to load the Razorpay script
    const loadRazorpayScript = () => {
      return new Promise<void>((resolve) => {
        if (window.Razorpay) {
          // Script already loaded
          resolve();
          return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.id = 'razorpay-script';
        script.async = true;
        script.onload = () => resolve();
        
        // Append to head
        document.head.appendChild(script);
      });
    };
    
    // Load the script but don't wait for it
    loadRazorpayScript();
    
    // No cleanup needed - we want the script to persist
  }, [isClient]);

  // Function to handle subscription
  const handleSubscription = async (plan: typeof PLANS[0]) => {
    try {
      if (plan.amountInr === 0) {
        // Free plan, no payment needed
        return;
      }

      setIsLoading(plan.amountInr);

      // Get user data - in a real app, this would come from authentication
      // For demo purposes, we'll use a modal or form to collect this
      const userEmail = prompt('Please enter your email for the subscription:');
      const userName = prompt('Please enter your name:');
      
      if (!userEmail) {
        alert('Email is required for subscription');
        setIsLoading(null);
        return;
      }
      
      setUserData({
        name: userName || 'User',
        email: userEmail,
      });

      // Create order on the server
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.amountInr,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            planName: plan.name,
            customerEmail: userEmail,
            customerName: userName,
          },
        }),
      });

      const orderData = await response.json();
      
      if (!orderData.id) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Function to safely load Razorpay and process payment
      const processPayment = async () => {
        // Ensure Razorpay is loaded
        if (!window.Razorpay && !orderData.isMockOrder) {
          // Load Razorpay script if not already loaded
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            document.head.appendChild(script);
          });
        }
        
        // Check if this is a mock order (for testing when Razorpay credentials aren't working)
        if (orderData.isMockOrder) {
          console.log('Using mock order for testing:', orderData.id);
          
          // Simulate a successful payment without opening Razorpay
          setTimeout(async () => {
            try {
              // Create mock payment data
              const mockPaymentData = {
                razorpay_payment_id: `pay_${Date.now()}`,
                razorpay_order_id: orderData.id,
                razorpay_signature: 'mock_signature',
                customerName: userData.name,
                customerEmail: userData.email,
                planName: plan.name,
                amount: orderData.amount,
              };
              
              // Send mock payment data to success endpoint
              const verifyResponse = await fetch('/api/payment-success', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockPaymentData),
              });
              
              // Redirect to success page
              router.push('/success');
            } catch (error) {
              console.error('Error in mock payment flow:', error);
              alert('There was an error processing your payment. Please try again.');
              setIsLoading(null);
            }
          }, 2000); // Simulate a 2-second payment process
        } else {
          // Create Razorpay options
          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Mockey AI',
            description: `${plan.name} Subscription`,
            order_id: orderData.id,
            handler: async function (response: any) {
              // Handle successful payment
              const paymentData = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                customerName: userData.name,
                customerEmail: userData.email,
                planName: plan.name,
                amount: orderData.amount,
              };

              // Verify payment on server and send email
              try {
                const verifyResponse = await fetch('/api/payment-success', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(paymentData),
                });

                const verifyData = await verifyResponse.json();
                
                // In test mode, always consider it successful
                // This is a workaround for test environments
                if (verifyData.success || orderData.isTestMode) {
                  console.log('Payment processed successfully');
                  // Redirect to success page
                  router.push('/success');
                } else {
                  console.error('Payment verification failed:', verifyData);
                  alert('Payment verification failed. Please contact support.');
                  router.push('/cancelled');
                }
              } catch (error) {
                console.error('Error during payment verification:', error);
                alert('There was an error processing your payment. Please try again.');
                router.push('/cancelled');
              }
            },
            prefill: {
              name: userData.name,
              email: userData.email,
            },
            theme: {
              color: '#3B82F6',
            },
            modal: {
              ondismiss: function() {
                setIsLoading(null);
                router.push('/cancelled');
              },
            },
          };

          // Initialize and open Razorpay checkout
          try {
            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
          } catch (error) {
            console.error('Error opening Razorpay:', error);
            alert('Could not initialize payment gateway. Please try again later.');
            setIsLoading(null);
          }
        }
      };
      
      // Process the payment
      processPayment();
      
      // Display test mode info if in test mode
      if (orderData.isTestMode) {
        console.log('Running in TEST MODE. Use test cards for payment.');
      }
    } catch (error) {
      console.error('Error during subscription process:', error);
      alert('Failed to process subscription. Please try again.');
      setIsLoading(null);
    }
  };

  if (!isClient) {
    return null; // Avoid rendering on server to prevent hydration errors
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="flex flex-col items-center text-center mx-auto mb-8">
        <span className="font-bricolage text-[48px] leading-[48px] font-bold tracking-normal text-gray-950">
          Unlock Magic With Mockey AI Premium Plans
        </span>
        <br />
        <span className="font-inter text-base leading-6 font-normal tracking-normal text-gray-950">
          Our Pro and Enterprise plans are crafted to cater to all your mockup and photography needs. Learn more about what we offer in our premium plans.
        </span>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan, idx) => (
          <div
            key={idx}
            className={`relative flex flex-col rounded-xl border border-gray-200 shadow-sm p-6 ${plan.bg} text-center`}
          >
            {/* Most Popular Badge */}
            {plan.highlight && (
              <div className="absolute top-2 right-2 bg-black text-white text-xs font-medium px-2 py-0.5 rounded z-10">
                ↑ {plan.highlight}
              </div>
            )}

            {/* Header */}
            <div
              className={`flex items-center justify-center gap-2 text-sm font-medium mb-4 ${
                plan.isLifetime ? 'text-white' : 'text-gray-900'
              }`}
            >
              <div className="text-xl">{plan.icon}</div>
              <div>{plan.name}</div>
            </div>

            {/* Price Section */}
            <div
              className={`text-2xl font-semibold mb-1 ${
                plan.isLifetime ? 'text-white' : 'text-gray-900'
              }`}
            >
              {plan.price}
            </div>
            {plan.oldPrice && (
              <div className="text-sm text-gray-400 line-through">{plan.oldPrice}</div>
            )}
            <div
              className={`text-sm mb-4 whitespace-pre-wrap ${
                plan.isLifetime ? 'text-white/70' : 'text-gray-500'
              }`}
            >
              {plan.subtext}
            </div>

            {/* Features */}
            <ul
              className={`flex-1 space-y-2 text-sm mb-6 ${
                plan.isLifetime ? 'text-white' : 'text-gray-700'
              }`}
            >
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 justify-center">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={() => handleSubscription(plan)}
              disabled={isLoading !== null}
              className={`w-full py-2 text-sm rounded-md font-medium transition ${
                isLoading === plan.amountInr
                  ? 'bg-gray-300 cursor-not-allowed'
                  : plan.isLifetime
                  ? 'bg-white text-gray-900 hover:bg-gray-200'
                  : plan.highlight
                  ? 'bg-pink-500 text-white hover:bg-pink-600'
                  : idx === 2
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isLoading === plan.amountInr ? 'Processing...' : plan.button}
            </button>
          </div>
        ))}
      </div>

      {/* Test Mode Banner */}
      <div className="max-w-7xl mx-auto mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800">Test Mode Active</h3>
        <p className="text-sm text-yellow-700">
          This integration is running in test mode. You can use Razorpay test cards to simulate payments.
          <br />
          Test Card: 4111 1111 1111 1111 | Expiry: Any future date | CVV: Any 3 digits | OTP: 1234
        </p>
      </div>

      <Enterprise />
      <PricingTable />
      <Plans />
      <Tweets />
      <Credits />
      <Faqs />
      <GetStarted />
    </div>
  );
}
