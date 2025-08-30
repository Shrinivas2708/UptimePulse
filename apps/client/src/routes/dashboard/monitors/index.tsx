import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMonitors,
  type IMonitor,
  deleteMonitor,
  fetchUserProfile,
  fetchMonitorSummary,
  toggleMonitor,
} from "../../../api";
import {
  BarChart,
  Plus,
  Trash2,
  Search,
  Filter,
  Play,
  Pause,
  
} from "lucide-react";
import { toast } from "sonner";
import  { useState } from "react";
import { ConfirmationModal } from "../../../components/ConfirmModel";

export const Route = createFileRoute("/dashboard/monitors/")({
  component: MonitorsListComponent,
});

// Reusable Confirmation Modal Component
// =================================================================================


function StatusBadge({ status }: { status: string }) {
  const statusStyles: { [key: string]: string } = {
    up: "bg-green-500/20 text-green-400",
    down: "bg-red-500/20 text-red-400",
    paused: "bg-yellow-500/20 text-yellow-400",
    default: "bg-gray-500/20 text-gray-400",
  };
  const text =
    { up: "Online", down: "Down", paused: "Paused" }[status] || status;
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center ${statusStyles[status] || statusStyles.default}`}
    >
      {text}
    </span>
  );
}

function MonitorsListComponent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monitorToDelete, setMonitorToDelete] = useState<IMonitor | null>(null);

  const { data: monitors, isLoading } = useQuery<IMonitor[]>({
    queryKey: ["userMonitors"],
    queryFn: fetchMonitors,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["monitorSummary"],
    queryFn: fetchMonitorSummary,
  });

  const { mutate: deleteMonitorMutation } = useMutation({
    mutationFn: deleteMonitor,
    onSuccess: (_, deletedId) => {
      toast.success("Monitor deleted successfully!");
      queryClient.setQueryData(
        ["userMonitors"],
        (oldData: IMonitor[] | undefined) =>
          oldData?.filter((m) => m._id !== deletedId) || []
      );
      queryClient.invalidateQueries({ queryKey: ["monitorSummary"] });
    },
    onError: (err) => toast.error(err.message || "Failed to delete monitor."),
  });

  const { mutate: toggleStatusMutation } = useMutation({
    mutationFn: toggleMonitor,
    onSuccess: (updatedMonitor) => {
        toast.success(`Monitor successfully ${updatedMonitor.active ? `resumed` : `paused`}.`);
        
        // ✨ FIX: This now updates BOTH the list and the specific monitor's cache
        queryClient.setQueryData(['userMonitors'], (oldData: IMonitor[] | undefined) => 
            oldData?.map(m => m._id === updatedMonitor._id ? updatedMonitor : m) || []
        );
        queryClient.setQueryData(['monitor', updatedMonitor._id], updatedMonitor);

        queryClient.invalidateQueries({ queryKey: ['monitorSummary'] });
    },
    onError: (err) => toast.error(err.message || "Failed to update monitor status."),
})
  const handleDeleteClick = (monitor: IMonitor) => {
    setMonitorToDelete(monitor);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (monitorToDelete) {
      deleteMonitorMutation(monitorToDelete._id);
    }
    setIsModalOpen(false);
    setMonitorToDelete(null);
  };

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
// console.log(monitors?.length)
  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Monitor"
        message={`Are you sure you want to permanently delete "${monitorToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between md:items-center gap-5 md:gap-0 flex-col md:flex-row">
            <h1 className="text-3xl md:text-2xl  font-bold">Monitors</h1>
            <div className="flex items-center gap-2  flex-col md:flex-row">
              <div className="flex gap-2 ">
                <div className="relative ">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search sites..."
                    className="input-style pl-9 w-48"
                  />
                </div>
                <button className="btn-secondary">
                  <Filter className="h-4 w-4" /> Filter
                </button>
              </div>
              <Link to="/dashboard/monitors/new" className="btn-primary">
                <Plus className="h-4 w-4" /> New Monitor
              </Link>
            </div>
          </div>

          <div className="bg-[#131211] border border-white/10 rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white/50 uppercase border-b border-white/10">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Frequency
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center p-6 text-white/50">
                        Loading monitors...
                      </td>
                    </tr>
                  ) : monitors && monitors.length > 0 ? (
                    monitors.map((monitor: IMonitor) => (
                      <tr
                        key={monitor._id}
                        className="hover:bg-[#1c1917] border-b border-white/10 last:border-b-0"
                      >
                        <td className="px-6 py-4 font-medium">
                          <Link
                            to="/dashboard/monitors/$monitorId"
                            params={{ monitorId: monitor._id }}
                            className="hover:text-green-400"
                          >
                            {monitor.name}
                            <p className="text-xs text-white/40 font-normal">
                              {monitor.url}
                            </p>
                          </Link>
                        </td>
                        <td className="px-6 py-4 uppercase">{monitor.type}</td>
                        <td className="px-6 py-4">
                          {monitor.interval / 60} min
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={monitor.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleStatusMutation(monitor._id)}
                              className="p-2 hover:bg-[#292524] rounded-md"
                            >
                              {monitor.active ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(monitor)}
                              className="p-2 hover:bg-[#292524] rounded-md"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center p-10 text-white/50"
                      >
                        <BarChart className="mx-auto h-12 w-12 mb-2 text-white/30" />
                        No monitors created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Current Status</h3>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {summaryData?.statusCounts.down || 0}
                </p>
                <p className="text-xs text-white/50">Down</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {summaryData?.statusCounts.up || 0}
                </p>
                <p className="text-xs text-white/50">Up</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">
                  {summaryData?.statusCounts.paused || 0}
                </p>
                <p className="text-xs text-white/50">Paused</p>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-3">
              Using {monitors?.length || 0} of {userProfile?.limits.monitors}{" "}
              monitors.
            </p>
          </div>
          <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Last 24 hours</h3>
            <div className="space-y-3">
              <div>
                <p className="text-lg font-bold text-green-500">
                  {monitors?.length === 0 ? "0": summaryData?.last24Hours.overallUptime.toFixed(2)}%
                </p>
                <p className="text-xs text-white/50">Overall uptime</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {summaryData?.last24Hours.incidentsCount}
                </p>
                <p className="text-xs text-white/50">Incidents</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
