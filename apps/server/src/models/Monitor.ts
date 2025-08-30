import { Schema, model, Document, Types } from 'mongoose';

export interface ContentCheck {
  _id?: Types.ObjectId; // Added to reflect Mongoose subdocument _id
  type: string;
  value: string;
}

interface Thresholds {
  responseTime: number;
  availability: number;
}

interface SslCheck {
  enabled: boolean;
  daysBeforeExpiry: number;
}

interface MaintenanceWindow {
  start: Date;
  end: Date;
  reason: string;
}

export interface IMonitor extends Document {
  userId: Types.ObjectId;
  name: string;
  url: string;
  type: string;
  interval: number;
  timeout: number;
  regions: string[];
  method: string;
  headers: Map<string, string>;
  body?: string;
  followRedirects: boolean;
  expectedStatusCodes: number[];
  thresholds: Thresholds;
  contentChecks: ContentCheck[];
  sslCheck: SslCheck;
  status: string;
  consecutiveFails: number;
  lastCheck?: Date;
  lastStatusChange?: Date;
  active: boolean;
  maintenanceWindows: MaintenanceWindow[];
  createdAt: Date;
  updatedAt: Date;
}

const monitorSchema = new Schema<IMonitor>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  interval: { type: Number, required: true },
  timeout: { type: Number, default: 30 },
  regions: [{ type: String }],
  method: { type: String, default: 'GET' },
  headers: { type: Map, of: String ,default: new Map()  },
  body: { type: String },
  followRedirects: { type: Boolean, default: true },
  expectedStatusCodes: [{ type: Number }],
  thresholds: {
    responseTime: { type: Number, default: 5000 },
    availability: { type: Number, default: 99 },
  },
  contentChecks: [{
    type: { type: String },
    value: { type: String },
  }],
  sslCheck: {
    enabled: { type: Boolean, default: false },
    daysBeforeExpiry: { type: Number, default: 30 },
  },
  status: { type: String, default: 'up' },
  consecutiveFails: { type: Number, default: 0 },
  lastCheck: { type: Date },
  lastStatusChange: { type: Date },
  active: { type: Boolean, default: true },
  maintenanceWindows: [{
    start: { type: Date },
    end: { type: Date },
    reason: { type: String },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model<IMonitor>('Monitor', monitorSchema);