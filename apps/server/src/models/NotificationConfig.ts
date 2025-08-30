import { Schema, model, Document, Types } from 'mongoose';

interface INotificationConfig extends Document {
  userId: Types.ObjectId;
  monitorId: Types.ObjectId;
  integrationId: Types.ObjectId; // References the user's configured integration
  createdAt: Date;
}

const notificationConfigSchema = new Schema<INotificationConfig>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true },
  integrationId: { type: Schema.Types.ObjectId, ref: 'Integration', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate configurations for the same monitor and integration
notificationConfigSchema.index({ monitorId: 1, integrationId: 1 }, { unique: true });

export default model<INotificationConfig>('NotificationConfig', notificationConfigSchema);
