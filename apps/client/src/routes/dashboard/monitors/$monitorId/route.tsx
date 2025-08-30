/* eslint-disable*/
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMonitorById, toggleMonitor, type IMonitor } from '../../../../api';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/monitors/$monitorId')({
  loader: ({ params, context }) => {
    //@ts-ignore
    return context.queryClient.ensureQueryData({
      queryKey: ['monitor', params.monitorId],
      queryFn: () => fetchMonitorById(params.monitorId),
    });
  },
  component: MonitorDetailLayout,
});

function MonitorDetailLayout() {
    const { monitorId } = Route.useParams();
    // console.log(monitorId)
    const queryClient = useQueryClient();
    const initialData = Route.useLoaderData();

    const { data: monitor } = useQuery<IMonitor>({
        queryKey: ['monitor', monitorId],
        queryFn: () => fetchMonitorById(monitorId),
        initialData: initialData,
    });

    const { mutate: toggleStatusMutation } = useMutation({
        mutationFn: toggleMonitor,
        onSuccess: (updatedMonitor) => {
            toast.success(`Monitor successfully ${updatedMonitor.active ? 'resumed' : 'paused'}.`);
            queryClient.setQueryData(['monitor', monitorId], updatedMonitor);
            queryClient.invalidateQueries({ queryKey: ['userMonitors', 'monitorSummary'] });
        },
        onError: (err) => toast.error(err.message || "Failed to update status."),
    });

    if (!monitor) {
        return <div className="p-4 text-center text-red-500">Monitor not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link to="/dashboard/monitors" className="p-2 rounded-md hover:bg-[#292524]">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{monitor.name}</h1>
                        <p className="text-sm text-white/50">{monitor.url}</p>
                    </div>
                </div>
                <button onClick={() => toggleStatusMutation(monitor._id)} className="btn-secondary">
                    {monitor.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {monitor.active ? 'Pause' : 'Resume'}
                </button>
            </div>

            <div className="flex items-center border-b border-white/10">
                {/* ✨ FIX: Using activeProps and inactiveProps for cleaner state styling */}
                <Link to="/dashboard/monitors/$monitorId" params={{monitorId}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}} activeOptions={{exact: true}}>Overview</Link>
                <Link to="/dashboard/monitors/$monitorId/notifications" params={{monitorId}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}}>Notifications</Link>
                <Link to="/dashboard/monitors/$monitorId/settings" params={{monitorId}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}}>Settings</Link>
                <Link to="/dashboard/monitors/$monitorId/delete" params={{monitorId}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}}>Delete</Link>
            </div>
            
            <div className="mt-6">
                <Outlet />
            </div>
        </div>
    );
}
