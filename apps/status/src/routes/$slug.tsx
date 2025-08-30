/* eslint-disable */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicStatusPage,
  type IStatusPage,
  type IMonitor,
  type IIncident,
} from "../api";
import { format, differenceInHours } from "date-fns";
import { Icon } from "../lib/exports";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";

export const Route = createFileRoute("/$slug")({
  component: PublicStatusPageComponent,
});

// Type definitions
type UptimeData = { date: string; endDate: string; uptime: number; incidents: IIncident[] };
type PopulatedMonitor = IMonitor & {
  uptimeData?: UptimeData[];
  incidents?: IIncident[];
  overallUptime?: string;
};
type MonitorWrapper = {
  _id: PopulatedMonitor;
  name: string;
  description: string;
  historyDuration?: number;
};

// ✨ NEW: Custom hook to check screen size for responsiveness
const useIsMobile = () => {
  // Set initial state from window, falling back to false for SSR
  const [isMobile, setIsMobile] = useState(() => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Helper component for monitor status text
function MonitorStatus({ status }: { status: string }) {
  const statusConfig = {
    up: { text: "Operational", color: "green" },
    down: { text: "Major Outage", color: "red" },
    paused: { text: "Paused", color: "yellow" },
  };
  const currentStatus = statusConfig[status as keyof typeof statusConfig] || { text: "Unknown", color: "gray" };
  const colorClasses = {
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    gray: "text-gray-400",
  };
  const classes = colorClasses[currentStatus.color as keyof typeof colorClasses];
  return (
    <span className={`text-sm font-medium ${classes}`}>{currentStatus.text}</span>
  );
}

// Helper component for incident status badges
function IncidentStatusBadge({ status }: { status: string }) {
  const isResolved = status.toLowerCase() === "resolved";
  const bgColor = isResolved ? "bg-green-500/10" : "bg-yellow-500/10";
  const textColor = isResolved ? "text-green-400" : "text-yellow-400";
  const dotColor = isResolved ? "bg-green-500" : "bg-yellow-500";

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${bgColor} ${textColor} flex-shrink-0`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Helper function to format incident duration
const formatDuration = (start: Date, end?: Date): string => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  let diff = Math.abs(endDate.getTime() - startDate.getTime()) / 1000;

  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const minutes = Math.floor(diff / 60);

  let durationString = '';
  if (hours > 0) durationString += `${hours} hr${hours !== 1 ? `s` : ``} `;
  if (minutes > 0 || hours === 0) durationString += `${minutes} min${minutes !== 1 ? `s` : ``}`;
  
  return durationString.trim() || "0 mins";
};

// Uptime bar component
function UptimeBar({ history , allIncidents } : {history:any , allIncidents:any}) {
  const isMobile = useIsMobile();
  const historyToShow = isMobile ? history.slice(-45) : history;

  const getBarColor = (uptime : number) => {
    if (uptime < 0) return "bg-gray-600/50";
    if (uptime === 100) return "bg-green-500";
    if (uptime >= 99.9) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-[2px] w-full">
      {(historyToShow || []).map((bucket:any, index:number)  => {
        const incidentsInBucket = (allIncidents || []).filter((inc: { startedAt: string | number | Date; }) => {
          const incidentTime = new Date(inc.startedAt).getTime();
          const startTime = new Date(bucket.date).getTime();
          const endTime = new Date(history[index + 1]?.date || new Date(bucket.date).setHours(new Date(bucket.date).getHours() + 4)).getTime(); // Assume 4-hour interval
          return incidentTime >= startTime && incidentTime < endTime;
        });
        const latestIncident = incidentsInBucket[0];

        // Calculate endDate as 4 hours after startDate if not provided
        const startDate = new Date(bucket.date);
        const endDate = new Date(history[index + 1]?.date || new Date(bucket.date).setHours(new Date(bucket.date).getHours() + 4));
        const diff = Math.abs(differenceInHours(endDate, startDate));
        const tooltipTitle = diff < 24
          ? `${format(startDate, `dd MMM, HH:mm`)} - ${format(endDate, `HH:mm zzz`)}`
          : format(startDate, "dd MMM yyyy");

        let tooltipContent = `<div class="font-bold text-sm">${tooltipTitle}</div>`;

        if (latestIncident) {
          const duration = formatDuration(latestIncident.startedAt, latestIncident.resolvedAt);
          const statusText = latestIncident.status === 'resolved' ? 'Past Incident' : 'Major Outage';
          const iconColor = bucket.uptime < 99.9 ? 'bg-red-500' : 'bg-yellow-500';
          const relatedMessage = latestIncident.timeline.length > 0 ? latestIncident.timeline[0].message : 'Incident reported.';

          tooltipContent += `
            <div class="flex items-center gap-2 font-semibold mt-2 text-xs">
              <span class="h-2 w-2 rounded-full ${iconColor}"></span>
              <span>${statusText}</span>
              <span class="text-white/50 font-normal">${duration}</span>
            </div>
            <div class="mt-2 text-xs text-white/80 border-t border-white/10 pt-2">
              RELATED<br/>
              ${relatedMessage}
            </div>
          `;
        } else if (bucket.uptime >= 0 && bucket.uptime < 100) {
          tooltipContent += `<div class="mt-1">${bucket.uptime.toFixed(2)}% Uptime</div>`;
        } else {
          tooltipContent += `<div class="mt-1">No downtime recorded.</div>`;
        }


        return (
          <div
            key={bucket.date}
            data-tooltip-id="uptime-tooltip"
            data-tooltip-html={tooltipContent}
            className={`h-8 flex-1 rounded-sm ${getBarColor(bucket.uptime)}`}
          />
        );
      })}
    </div>
  );
}

// Main Page Component
function PublicStatusPageComponent() {
  const { slug } = Route.useParams();
  const { data: page, isLoading, error } = useQuery<IStatusPage>({
    queryKey: ["publicStatusPage", slug],
    queryFn: () => fetchPublicStatusPage(slug),
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const INCIDENTS_PER_PAGE = 5;

  useEffect(() => {
    if (page?.name) document.title = `${page.name} Status`;
    if (page?.branding?.faviconUrl) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = page.branding.faviconUrl;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }, [page]);
console.log(error?.message === "Request failed with status code 404");
  if(error?.message === "Request failed with status code 404") {return <div className="h-screen flex justify-center items-center ">404  | Status Page Not Found</div>}
  if (error) { return <div className="p-4 text-center">Error: {error.message}</div> }
  if (isLoading || !page) { return <div className="p-4 text-center h-screen flex justify-center items-center">Loading status page...</div> }

  const allMonitors = (page.monitorSections || []).flatMap(s => (s.monitors as MonitorWrapper[]).map(m => m._id));
  const overallStatus = allMonitors.some(m => m.status === "down") ? "down" : "up";

  const totalPages = Math.ceil((page.recentIncidents?.length || 0) / INCIDENTS_PER_PAGE);
  const paginatedIncidents = page.recentIncidents?.slice(
    (currentPage - 1) * INCIDENTS_PER_PAGE,
    currentPage * INCIDENTS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white font-sans">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-4xl">
          <a href={page.branding?.logoRedirectUrl || "#"} className="flex items-center gap-3">
            <img src={page.branding?.logoUrl || Icon} alt="Logo" className="h-8 w-8 rounded-md" />
            <h1 className="text-xl font-bold">{page.name}</h1>
          </a>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${overallStatus === `up` ? `bg-green-500/10 text-green-400` : `bg-red-500/10 text-red-400`}`}>
            <div className={`h-2 w-2 rounded-full ${overallStatus === `up` ? `bg-green-500` : `bg-red-500`}`}></div>
            {overallStatus === "up" ? "All services are online" : "Some services are experiencing issues"}
          </div>
          <p className="text-sm text-white/50 mt-2">
            As of {format(new Date(), "MMMM d, yyyy")} at {format(new Date(), "h:mm a z")}
          </p>
        </div>

        <div className="mt-12 space-y-8 max-w-4xl mx-auto">
          {(page.monitorSections || []).map((section, index) => (
            <div key={index}>
              <h2 className="text-lg font-semibold mb-4">{section.name}</h2>
              <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6">
                {(section.monitors as MonitorWrapper[]).length > 0 ? (
                  (section.monitors as MonitorWrapper[]).map((monitorWrapper) => {
                    const monitor = monitorWrapper._id;
                    const duration = monitorWrapper.historyDuration || 90;
                    const allIncidentsForMonitor = (monitor.uptimeData || []).flatMap(day => day.incidents);

                    return (
                      <div key={monitor._id} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{monitorWrapper.name}</p>
                          <MonitorStatus status={monitor.status} />
                        </div>
                        <UptimeBar
                          history={monitor.uptimeData || []}
                          allIncidents={allIncidentsForMonitor}
                        />
                        <div className="flex justify-between text-xs text-white/40">
                          <span>{duration} days ago</span>
                          <span>Today</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/50 text-center">No monitors have been added to this section.</p>
                )}
              </div>
            </div>
          ))}
        </div>

      <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Recent Incidents</h2>
          {paginatedIncidents && paginatedIncidents.length > 0 ? (
            <div>
              <div className="space-y-6">
                {paginatedIncidents.map(incident => (
                  <div key={incident._id}>
                    <div className="flex justify-between items-start gap-4 p-4 bg-[#131211] border-b border-white/10 rounded-t-lg">
                      <div>
                        <h3 className="font-semibold text-white/90">{incident.title}</h3>
                        <p className="text-xs text-white/50 mt-1">{format(new Date(incident.startedAt), "MMMM d, yyyy")}</p>
                      </div>
                      <IncidentStatusBadge status={incident.status} />
                    </div>
                    <div className="bg-[#0c0a09] border border-t-0 border-white/10 rounded-b-lg p-4 pl-6">
                      <div className="relative border-l-2 border-dashed border-white/10 space-y-6">
                        {incident.timeline.map((event, index) => (
                          <div key={index} className="relative pl-6">
                            <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-white/30"></div>
                            <p className="text-sm text-white/80">{event.message}</p>
                            <p className="text-xs text-white/50 mt-1">{format(new Date(event.timestamp), "HH:mm zzz")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    className="btn-secondary"
                  >
                    &larr; Previous
                  </button>
                  <span className="text-sm text-white/50">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    className="btn-secondary"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/50 bg-[#131211] border border-white/10 rounded-lg p-8">
              <p>No incidents reported in the last 90 days.</p>
            </div>
          )}
        </div>


        <div className="mt-12 text-center">
          <p className="text-xs text-white/40">Powered by UptimePulse</p>
        </div>
      </main>
      <Tooltip id="uptime-tooltip" style={{
          backgroundColor: "#1c1917", color: "white", fontSize: "12px",
          padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.1)",
      }}/>
    </div>
  );
}