// server/src/models/CustomDomain.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomDomain extends Document {
  userId: Types.ObjectId;
  statusPageId: Types.ObjectId;
  domain: string;
  verified: boolean;
  verificationToken: string;
  createdAt: Date;
}

const customDomainSchema = new Schema<ICustomDomain>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  statusPageId: { type: Schema.Types.ObjectId, ref: 'StatusPage', required: true },
  domain: { type: String, required: true, unique: true },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<ICustomDomain>('CustomDomain', customDomainSchema);