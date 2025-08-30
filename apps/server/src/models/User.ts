import { Schema, model, Document } from 'mongoose';

interface Subscription {
  status?: string;
  planType: 'free' | 'pro' | 'lifetime';
  expiresAt?: Date; // For monthly 'pro' plan
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

interface Limits {
  monitors: number;
  checkInterval: number;
  historyDays: number;
}

interface Preferences {
  timezone: string;
  notifications: {
    email: boolean;
    dashboard: boolean;
  };
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  googleId?: string;
  tier: string;
  subscription: Subscription;
  limits: Limits;
  preferences: Preferences;
  createdAt: Date;
  updatedAt: Date;
  isSubscriptionActive(): boolean; // Added method to interface
}

const userSchema = new Schema< IUser>({
  name: { type: String, default:"Explorer"},
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  emailVerified: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  tier: { type: String, default: 'free' },
  subscription: {
    status: { type: String },
    planType: { type: String, default: 'free' }, // Correctly added
    expiresAt: { type: Date }, // Correctly added
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    razorpaySignature: { type: String },
  },
  limits: {
    monitors: { type: Number, default: 5 },       // Free plan: 5 monitors
    checkInterval: { type: Number, default: 300 }, // Free plan: 5 min (300s)
    historyDays: { type: Number, default: 1 },    // Free plan: 24 hours (1 day)
  },
  preferences: {
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      dashboard: { type: Boolean, default: true },
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Method to check if the subscription is currently active
userSchema.methods.isSubscriptionActive = function(): boolean {
  if (this.subscription.planType === 'lifetime') {
    return true;
  }
  if (this.subscription.planType === 'pro' && this.subscription.expiresAt) {
    // Check if the expiry date is in the future
    return this.subscription.expiresAt > new Date();
  }
  return false; // Free plan is never 'active' in a paid sense
};

export default model<IUser>('User', userSchema);