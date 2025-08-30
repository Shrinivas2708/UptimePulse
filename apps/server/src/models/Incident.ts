import { Schema, model, Document, Types } from 'mongoose';

interface TimelineEvent {
  timestamp: Date;
  status: string;
  message: string;
  author: string;
}

interface ImpactAnalysis {
  totalDowntime: number;
  affectedRegions: string[];
  estimatedUsers?: number;
}

interface IIncident extends Document {
  monitorId?: Types.ObjectId;
  statusPageId?: Types.ObjectId;
  title: string;
  description?: string;
  status: string;
  severity: string;
  timeline: TimelineEvent[];
  affectedServices: Types.ObjectId[];
  startedAt: Date;
  resolvedAt?: Date;
  rootCause?: string;
  impactAnalysis: ImpactAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>({
  monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor' },
  statusPageId: { type: Schema.Types.ObjectId, ref: 'StatusPage' },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'investigating' },
  severity: { type: String, default: 'minor' },
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    status: { type: String },
    message: { type: String },
    author: { type: String },
  }],
  affectedServices: [{ type: Schema.Types.ObjectId, ref: 'Monitor' }],
  startedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  rootCause: { type: String },
  impactAnalysis: {
    totalDowntime: { type: Number, default: 0 },
    affectedRegions: [{ type: String }],
    estimatedUsers: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model<IIncident>('Incident', incidentSchema);