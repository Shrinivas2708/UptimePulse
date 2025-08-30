import { Schema, model, Document, Types } from 'mongoose';

interface SslInfo {
  valid?: boolean;
  expiresAt?: Date;
  issuer?: string;
}

interface ErrorInfo {
  type?: string;
  message?: string;
  details?: any;
}

interface ContentCheckResult {
  checkId: string;
  passed: boolean;
  actualValue?: string;
}

interface ICheckResult extends Document {
  monitorId: Types.ObjectId;
  timestamp: Date;
  region?: string;
  status?: string;
  responseTime?: number;
  statusCode?: number;
  resolvedIp?: string;
  sslInfo?: SslInfo;
  error?: ErrorInfo;
  contentCheckResults: ContentCheckResult[];
}

const checkResultSchema = new Schema<ICheckResult>({
  monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true },
  timestamp: { type: Date, default: Date.now },
  region: { type: String },
  status: { type: String },
  responseTime: { type: Number },
  statusCode: { type: Number },
  resolvedIp: { type: String },
  sslInfo: {
    valid: { type: Boolean },
    expiresAt: { type: Date },
    issuer: { type: String },
  },
  error: {
    type: { type: String },
    message: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  contentCheckResults: [{
    checkId: { type: String },
    passed: { type: Boolean },
    actualValue: { type: String },
  }],
});

checkResultSchema.index({ monitorId: 1, timestamp: -1 });

export default model<ICheckResult>('CheckResult', checkResultSchema);