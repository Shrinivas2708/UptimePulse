import { createFileRoute,Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents, type IIncident } from "../../../api";
import {  ShieldAlert } from "lucide-react";
// ✨ FIX: Removed the problematic date-fns duration import
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/incidents/")({
  component: IncidentsComponent,
});

function StatusBadge({ status }: { status: string }) {
  const isResolved = status.toLowerCase() === "resolved";
  const bgColor = isResolved ? "bg-green-500/20" : "bg-red-500/20";
  const textColor = isResolved ? "text-green-400" : "text-red-400";
  const dotColor = isResolved ? "bg-green-500" : "bg-red-500";

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${bgColor} ${textColor}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function IncidentsComponent() {
  const { data: incidents, isLoading } = useQuery<IIncident[]>({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  // ✨ FIX: A robust, manual duration calculation function
  const getDuration = (startedAt: Date, resolvedAt?: Date): string => {
    const start = new Date(startedAt);
    const end = resolvedAt ? new Date(resolvedAt) : new Date();
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes";
    return Math.floor(seconds) + " seconds";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Incidents</h1>
        {/* You can add filter buttons here later */}
      </div>

      <div className="bg-[#131211] border border-white/10 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase border-b border-white/10">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Monitor
                </th>
                <th scope="col" className="px-6 py-3">
                  Started
                </th>
                <th scope="col" className="px-6 py-3">
                  Resolved
                </th>
                <th scope="col" className="px-6 py-3">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-6">
                    Loading incidents...
                  </td>
                </tr>
              ) : incidents && incidents.length > 0 ? (
                incidents.map((incident) => (
                  <tr
                    key={incident._id}
                    className="hover:bg-[#1c1917] border-b border-white/10 last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <Link to="/dashboard/incidents/$incidentId" params={{ incidentId: incident._id }} className="hover:text-green-400">
                        <StatusBadge status={incident.status} />
                    </Link>
                    </td>
                    <td className="px-6 py-4 font-medium"><Link to="/dashboard/incidents/$incidentId" params={{ incidentId: incident._id }} className="hover:text-green-400">
                        {incident.title}
                    </Link></td>
                    <td className="px-6 py-4 text-white/70">
                      {format(
                        new Date(incident.startedAt),
                        "MMM d, yyyy, HH:mm:ss"
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {incident.resolvedAt
                        ? format(
                            new Date(incident.resolvedAt),
                            "MMM d, yyyy, HH:mm:ss"
                          )
                        : "Not yet resolved"}
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {getDuration(incident.startedAt, incident.resolvedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-10 text-white/50">
                    <ShieldAlert className="mx-auto h-12 w-12 mb-2" />
                    Nothing to see here. You're all caught up!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
