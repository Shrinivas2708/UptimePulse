import { Schema, model, Document, Types } from "mongoose";

interface Branding {
  logoUrl?: string;
  faviconUrl?: string;
  colors?: {
    // Make colors object optional
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  customCss?: string;
}
interface CustomMonitor {
  _id: Types.ObjectId; // Reference to the actual Monitor document
  name?: string; // Optional override name
  description?: string; // Optional tooltip description
  historyDuration?: number;
}
interface MonitorSection {
  name: string;
  monitors: CustomMonitor[];
}
interface Branding {
  logoUrl?: string;
  faviconUrl?: string;
  logoRedirectUrl?: string; // ✨ NEW
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  customCss?: string;
}
interface Features {
  subscriberNotifications: boolean;
  incidentHistory: boolean;
  uptimePercentage: boolean;
  responseTimeChart: boolean;
}

export interface IStatusPage extends Document {
  userId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  branding: Branding;
  monitors: Types.ObjectId[];
  customDomains: string[];
  features: Features;
  visibility: string;
  password?: string;
  embedCode?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  monitorSections: MonitorSection[];
  degradedThreshold: number;
}

const statusPageSchema = new Schema<IStatusPage>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  description: { type: String },
  branding: {
    logoUrl: { type: String },
    faviconUrl: { type: String },
    logoRedirectUrl: { type: String },
    colors: {
      // Define colors as an optional subdocument in the schema
      primary: { type: String },
      secondary: { type: String },
      background: { type: String },
      text: { type: String },
    },
    customCss: { type: String },
  },
  monitors: [{ type: Schema.Types.ObjectId, ref: "Monitor" }],
  customDomains: [{ type: String }],
  features: {
    subscriberNotifications: { type: Boolean, default: false },
    incidentHistory: { type: Boolean, default: true },
    uptimePercentage: { type: Boolean, default: true },
    responseTimeChart: { type: Boolean, default: true },
  },
  visibility: { type: String, default: "public" },
  password: { type: String },
  embedCode: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  monitorSections: [
    {
      name: { type: String, required: true },
      monitors: [
        {
          _id: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
          name: { type: String },
          description: { type: String },
          historyDuration: { type: Number, default: 90 },
        },
      ],
    },
  ],
  degradedThreshold: { type: Number, default: 100 },
});

export default model<IStatusPage>("StatusPage", statusPageSchema);
