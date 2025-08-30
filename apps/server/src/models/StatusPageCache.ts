// srcs/models/StatusPageCache.ts

import { Schema, model, Document, Types } from 'mongoose';

// Define the structure for a single monitor's cached data
interface ICachedMonitor {
  _id: Types.ObjectId;
  name: string; // Public-facing name
  description: string;
  status: string;
  historyDuration: number;
  overallUptime: string; // Pre-calculated overall uptime percentage
  uptimeData: { // Pre-calculated uptime bars
    date: string;
    endDate: string;
    uptime: number;
    incidents: any[]; // You can use a more specific type if needed
  }[];
}

// Define the structure for the entire status page cache document
export interface IStatusPageCache extends Document {
  statusPageId: Types.ObjectId;
  slug: string;
  pageData: {
    name: string;
    branding: any;
    monitorSections: {
      name: string;
      monitors: ICachedMonitor[];
    }[];
    recentIncidents: any[];
  };
  lastUpdatedAt: Date;
}

const statusPageCacheSchema = new Schema<IStatusPageCache>({
  statusPageId: { type: Schema.Types.ObjectId, ref: 'StatusPage', required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  pageData: {
    name: String,
    branding: Schema.Types.Mixed,
    monitorSections: [{
      name: String,
      monitors: [Schema.Types.Mixed] // Storing denormalized monitor data
    }],
    recentIncidents: [Schema.Types.Mixed]
  },
  lastUpdatedAt: { type: Date, default: Date.now },
});

export default model<IStatusPageCache>('StatusPageCache', statusPageCacheSchema);