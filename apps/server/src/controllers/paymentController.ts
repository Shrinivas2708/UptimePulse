import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User';
import logger from '../utils/logger';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Define plans on the server to prevent client-side manipulation
const plans = {
  pro: { amount: 499, currency: "INR", durationDays: 30 },
  lifetime: { amount: 2499, currency: "INR", durationDays: null }, // ₹2499 for lifetime
};

export const createRazorpayOrder = async (req: Request, res: Response): Promise<void> => {
  const userPayload = req.user as { userId: string };
  const { plan } = req.body as { plan: 'pro' | 'lifetime' };

  if (!plans[plan]) {
     res.status(400).json({ error: 'Invalid plan selected' });return
  }

  const selectedPlan = plans[plan];

  try {
    const user = await User.findById(userPayload.userId);
    if (!user) {
       res.status(404).json({ error: 'User not found' });return
    }

    // ✨ FIX: Create a shorter, unique receipt ID ✨
    const receiptId = `${plan.substring(0, 4)}-${Date.now()}`;

    const options = {
      amount: selectedPlan.amount * 100,
      currency: selectedPlan.currency,
      receipt: receiptId, // Use the new, shorter receipt ID
      notes: {
        plan,
        userId: user._id!.toString(),
      }
    };
    
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, currency: order.currency, amount: order.amount });

  } catch (err) {
    console.error('!!! Razorpay Order Creation Raw Error:', err); 
    logger.error('Razorpay order creation failed');
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};


export const verifyRazorpayPayment = async (req: Request, res: Response): Promise<void> => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
        res.status(400).json({ error: 'Invalid payment signature.' });
        return 
    }

    // Fetch order details from Razorpay to get the plan from notes
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // ✨ FIX STARTS HERE ✨
    // 1. Check if notes object exists
    if (!order.notes) {
        logger.error(`Order ${razorpay_order_id} is missing notes for payment verification.`);
        res.status(400).json({ error: 'Critical payment information is missing.' });
        return 
    }

    // 2. Safely access properties from the notes object
    const plan = order.notes.plan as 'pro' | 'lifetime';
    const userId = order.notes.userId as string;
    // ✨ FIX ENDS HERE ✨

    const selectedPlan = plans[plan];

    const subscriptionUpdate: any = {
      tier: 'pro', // Both paid plans are 'pro' tier for feature access
      'subscription.planType': plan,
      'subscription.status': 'active',
      'subscription.razorpayPaymentId': razorpay_payment_id,
      'subscription.razorpayOrderId': razorpay_order_id,
      'subscription.razorpaySignature': razorpay_signature,
    };

    if (plan === 'pro') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + selectedPlan.durationDays!);
      subscriptionUpdate['subscription.expiresAt'] = expiryDate;
      // Pro plan limits
      subscriptionUpdate['limits.monitors'] = 10;
      subscriptionUpdate['limits.checkInterval'] = 60; // 1 minute
      subscriptionUpdate['limits.historyDays'] = 365;
    } else if (plan === 'lifetime') {
      subscriptionUpdate['subscription.expiresAt'] = null; // Lifetime doesn't expire
       // Lifetime plan limits
      subscriptionUpdate['limits.monitors'] = 10;
      subscriptionUpdate['limits.checkInterval'] = 60; // 1 minute
      subscriptionUpdate['limits.historyDays'] = 90;
    }
    
    await User.findByIdAndUpdate(userId, subscriptionUpdate);
    
    res.json({ message: `Payment successful! ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated.` });
};