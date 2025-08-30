import { Schema, model, Document, Types } from 'mongoose';

export interface IIntegration extends Document {
  userId: Types.ObjectId;
  type: 'email' | 'discord' | 'slack' | 'webhook' | 'telegram' | 'teams' | 'googlechat' | 'twiliosms' | 'pagerduty';
  name: string;
  details: {
    webhookUrl?: string;
    email?: string;
    integrationKey?: string;
    botToken?: string;
    chatId?: string;
    accountSid?: string;
    fromNumber?: string;
    toNumber?: string;
  };
  createdAt: Date;
}

const integrationSchema = new Schema<IIntegration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['email', 'discord', 'slack', 'webhook', 'telegram', 'teams', 'googlechat', 'twiliosms', 'pagerduty'] },
  name: { type: String, required: true },
  details: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<IIntegration>('Integration', integrationSchema);
