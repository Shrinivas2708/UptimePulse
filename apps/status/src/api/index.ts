import { apiClient } from "../lib/axios";

// Define the shape of the user data we expect from the backend\
export interface IIntegration {
  _id: string;
  type: string;
  name: string;
  details: {
    webhookUrl?: string;
    email?: string;
    integrationKey?: string;
    botToken?: string;
    chatId?: string;
    accountSid?: string;
    fromNumber?: string;
  }
}

export interface INotificationConfig {
  _id: string;
  monitorId: string;
  integrationId: IIntegration; // Populated by the backend
}
export interface UserProfile {
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
  isSubscriptionActive(): boolean;
}
export interface INotificationConfig {
  _id: string;
  channel: string;
  destination: string;
}

interface Subscription {
  status?: string;
  currentPeriodEnd?: Date;
  priceId?: string;
  // ✨ FIX: Added planType to match the backend model and usage in components
  planType: 'free' | 'pro' | 'lifetime';
}
interface IRegionalAverage {
  region: string;
  averageResponseTime: number;
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
export interface UpdateUserData {
  name?: string;
  password?: string;
  timezone?: string;
}
export interface IMonitor {
  _id: string;
  name: string;
  url: string;
  type: string;
  interval: number; // in seconds
  status: "up" | "down" | "paused" | "degraded" | "error";
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
  lastCheck?: Date;
  lastStatusChange?: Date;
  active: boolean;
  maintenanceWindows: MaintenanceWindow[];
  createdAt: Date;
  updatedAt: Date;
  uptimeHistory:number[]
}
export interface ContentCheck {
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

export interface IIncident {
  _id: string;
  monitorId?: string;
  statusPageId?: string;
  title: string;
  description?: string;
  status: string;
  severity: string;
  timeline: TimelineEvent[];
  affectedServices: string;
  startedAt: Date;
  resolvedAt?: Date;
  rootCause?: string;
  impactAnalysis: ImpactAnalysis;
  createdAt: Date;
  updatedAt: Date;
}
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
export interface IMonitorSummary {
  statusCounts: {
    up: number;
    down: number;
    paused: number;
  };
  last24Hours: {
    overallUptime: number;
    incidentsCount: number;
  };
}

export const createRazorpayOrder = async (
  plan: "pro" | "lifetime"
): Promise<{ orderId: string; currency: string; amount: number }> => {
  const { data } = await apiClient.post("/payments/create-order", { plan });
  return data;
};
export const verifyRazorpayPayment = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ message: string }> => {
  const { data } = await apiClient.post(
    "/payments/verify-payment",
    paymentData
  );
  return data;
};
export const fetchUserProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get("/auth/profile");
  return data;
};

export const updateUserProfile = async (
  userData: UpdateUserData
): Promise<{ message: string }> => {
  const { data } = await apiClient.put("/auth/profile", userData);
  return data;
};
export interface ICheckResult {
  _id: string;
  monitorId: string;
  timestamp: string;
  status?: string;
  responseTime?: number;
  statusCode?: number;
}
interface ISslInfo {
  valid: boolean;
  expiresAt: string;
  issuer: string;
}
export interface IMonitorStats {
  recentResults: ICheckResult[];
  averageResponseTime: number;
  sslInfo?: ISslInfo; 
  regionalAverages: IRegionalAverage[];
  recentIncidents: IIncident[];
  uptimePercentage: number;
}

export const fetchMonitorById = async (
  monitorId: string
): Promise<IMonitor> => {
  const { data } = await apiClient.get(`/monitors/${monitorId}`);
  return data;
};

export const fetchMonitorStats = async (
  monitorId: string,
  period: '24h' | '7d' | '30d' = '24h'
): Promise<IMonitorStats> => {
  const { data } = await apiClient.get(`/monitors/${monitorId}/stats`, { params: { period } });
  return data;
};

export const fetchMonitorSummary = async (): Promise<IMonitorSummary> => {
  const { data } = await apiClient.get("/monitors/stats/summary");
  return data;
};

export const createMonitor = async (
  monitorData: Partial<IMonitor>
): Promise<IMonitor> => {
  const { data } = await apiClient.post("/monitors", monitorData);
  return data;
};

export const deleteMonitor = async (monitorId: string): Promise<void> => {
  await apiClient.delete(`/monitors/${monitorId}`);
};

// --- INCIDENTS ---
export const fetchIncidents = async (): Promise<IIncident[]> => {
  const { data } = await apiClient.get("/incidents");
  return data;
};

export const fetchIncidentById = async (
  incidentId: string
): Promise<IIncident> => {
  const { data } = await apiClient.get(`/incidents/${incidentId}`);
  return data;
};
export const fetchMonitors = async (): Promise<IMonitor[]> => {
  const { data } = await apiClient.get("/monitors");
  return data;
};
export const toggleMonitor = async (monitorId: string): Promise<IMonitor> => {
  const { data } = await apiClient.patch(`/monitors/${monitorId}/toggle`);
  return data;
};
export interface INotificationConfig {
  _id: string;
  channel: string;
  destination: string;
}


export interface IMonitorSettings {
  name: string;
  url: string;
  expectedStatusCodes: number[];
  interval?: number;
}
export const updateMonitorSettings = async (monitorId: string, settings: IMonitorSettings): Promise<IMonitor> => {
  const { data } = await apiClient.put(`/monitors/${monitorId}/settings`, settings);
  return data;
};
export const fetchIntegrations = async (): Promise<IIntegration[]> => {
  const { data } = await apiClient.get('/integrations');
  return data;
};

export const createIntegration = async (integrationData: Partial<IIntegration>): Promise<IIntegration> => {
  const { data } = await apiClient.post('/integrations', integrationData);
  return data;
};

export const deleteIntegration = async (integrationId: string): Promise<void> => {
  await apiClient.delete(`/integrations/${integrationId}`);
};

// --- TWILIO ---
export const sendTwilioTestSms = async (toNumber: string, message: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post('/integrations/twilio/test-sms', { toNumber, message });
  return data;
}

// --- NOTIFICATIONS (Updated Logic) ---
export const fetchNotificationConfigs = async (monitorId: string): Promise<INotificationConfig[]> => {
  const { data } = await apiClient.get(`/notifications/${monitorId}`);
  return data;
};

export const createNotificationConfig = async (monitorId: string, integrationId: string): Promise<INotificationConfig> => {
    const { data } = await apiClient.post(`/notifications/${monitorId}`, { integrationId });
    return data;
};

export const deleteNotificationConfig = async (monitorId: string, configId: string): Promise<void> => {
  await apiClient.delete(`/notifications/${monitorId}/${configId}`);
};
export interface IStatusPage {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    logoRedirectUrl?: string;
    customCss?: string;
  };
  monitorSections: {
      name: string;
      monitors: {
          _id: string | IMonitor;
          name?: string;
          description?: string;
          historyDuration:number
      }[];
  }[];
  degradedThreshold: number;
  customJs?: string;
  active: boolean;
  recentIncidents?: IIncident[]
}

export const fetchStatusPages = async (): Promise<IStatusPage[]> => {
  const { data } = await apiClient.get('/status-pages');
  return data;
};

// ✨ NEW: Fetch a single page for management
export const fetchStatusPageBySlug = async (slug: string): Promise<IStatusPage> => {
    const { data } = await apiClient.get(`/status-pages/${slug}`);
    return data;
}

// ✨ NEW: Fetch a single page for public view (no auth needed)
export const fetchPublicStatusPage = async (slug: string): Promise<IStatusPage> => {
    const { data } = await apiClient.get(`/status-pages/public/${slug}`);
    return data;
}

export const createStatusPage = async (pageData: {
  name: string;
  slug: string;
  branding?: { logoUrl?: string; faviconUrl?: string };
}): Promise<IStatusPage> => {
  const { data } = await apiClient.post('/status-pages', pageData);
  return data;
};

// ✨ NEW: Update an existing page
export const updateStatusPage = async (slug: string, pageData: Partial<IStatusPage>): Promise<IStatusPage> => {
    const { data } = await apiClient.put(`/status-pages/${slug}`, pageData);
    return data;
}

// ✨ NEW: Delete a page
export const deleteStatusPage = async (slug: string): Promise<void> => {
    await apiClient.delete(`/status-pages/${slug}`);
}
export const addIncidentUpdate = async (incidentId: string, update: { message: string; status?: string }): Promise<IIncident> => {
  const { data } = await apiClient.post(`/incidents/${incidentId}/updates`, update);
  return data;
};