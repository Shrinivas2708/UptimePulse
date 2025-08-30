import { createFileRoute } from '@tanstack/react-router';
// 1. Import useQueryClient
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMonitorStats, type IMonitorStats, fetchMonitorById, type IMonitor } from '../../../../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import React, { useEffect } from 'react';
import { Route as parentRoute } from './route'; // Import the parent route

export const Route = createFileRoute('/dashboard/monitors/$monitorId/')({
  component: OverviewComponent,
});

const formatRegionName = (regionId: string) => {
    const names: { [key: string]: string } = { 'na_west': 'North America (West)', 'na_east': 'North America (East)', 'eu_west': 'Europe (West)', 'asia_pacific': 'Asia Pacific', 'oceania': 'Oceania' };
    return names[regionId] || regionId;
}

function OverviewComponent() {
    const { monitorId } = Route.useParams();
    const initialMonitorData = parentRoute.useLoaderData();
    // 2. Get the queryClient instance
    const queryClient = useQueryClient();
    console.log(queryClient);
    
    const { data: monitor } = useQuery<IMonitor>({
        queryKey: ['monitor', monitorId],
        queryFn: () => fetchMonitorById(monitorId),
        initialData: initialMonitorData,
    });
    
    const [period, setPeriod] = React.useState<'24h' | '7d' | '30d'>('24h');

    const refetchInterval = monitor?.active ? monitor.interval * 1000 : false;
    
    const { data: stats, isLoading } = useQuery<IMonitorStats>({
        queryKey: ['monitorStats', monitorId, period],
        queryFn: () => fetchMonitorStats(monitorId, period),
        refetchInterval: refetchInterval,
        refetchIntervalInBackground: true,
        // 3. ✨ ADD THIS CALLBACK ✨
        // When stats are successfully fetched, invalidate the monitor query
        // to trigger a refetch for its data (like lastCheck and status).
       
    });
    useEffect(() => {
        // This effect runs whenever 'stats' data changes (i.e., on a successful fetch)
        if (stats) {
            queryClient.invalidateQueries({ queryKey: ['monitor', monitorId] });
        }
    }, [stats, queryClient, monitorId]); // Dependencies for the effect

    const chartData = stats?.recentResults.map(r => ({ time: new Date(r.timestamp).getTime(), responseTime: r.responseTime })).reverse();
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'up': return 'text-green-400';
            case 'down': return 'text-red-400';
            case 'paused': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };
    
    if (!monitor) {
        return <div className="text-center p-8 text-white/50">Loading monitor details...</div>;
    }

    if (isLoading) {
        return <div className="text-center p-8 text-white/50">Loading stats...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70">Current Status</p>
                    <p className={`text-xl font-bold mt-1 ${getStatusColor(monitor.status)}`}>
                        {monitor.status.toUpperCase()}
                    </p>
                </div>
                <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70">Avg. Response ({period})</p>
                    <p className="text-xl font-bold mt-1">{stats?.averageResponseTime.toFixed(0)} ms</p>
                </div>
                <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70">Uptime ({period})</p>
                    <p className="text-xl font-bold mt-1">{stats?.uptimePercentage}</p> {/* Placeholder */}
                </div>
                <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70">Last Check</p>
                    <p className="text-xl font-bold mt-1">{monitor.lastCheck ? format(new Date(monitor.lastCheck), 'HH:mm:ss') : 'N/A'}</p>
                </div>
            </div>

            {/* ... Rest of the component ... */}
            <div className="bg-[#131211] border border-white/10 rounded-lg p-6 h-96">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Response Time</h3>
                    <div className="flex items-center gap-1 bg-[#0c0a09] border border-white/10 rounded-md p-1">
                        {(['24h', '7d', '30d'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-2 py-1 text-xs rounded ${period === p ? 'bg-[#292524] text-white' : 'text-white/50 hover:bg-[#1c1917]'}`}>
                                Last {p === '24h' ? '24 hours' : p === '7d' ? '7 days' : '30 days'}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)"/>
                        <XAxis dataKey="time" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(unixTime) => format(new Date(unixTime), 'HH:mm')} domain={['dataMin', 'dataMax']} type="number"/>
                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ms`}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }} labelFormatter={(unixTime) => format(new Date(unixTime), 'MMM d, yyyy HH:mm:ss')}/>
                        <Line type="monotone" dataKey="responseTime" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            
            {/* Region Response Times Table */}
            <div className="bg-[#131211] border border-white/10 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Region</th>
                            <th scope="col" className="px-6 py-3">Average Response Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats?.regionalAverages.map(regionStat => (
                            <tr key={regionStat.region} className="border-t border-white/10">
                                <td className="px-6 py-4">{formatRegionName(regionStat.region)}</td>
                                <td className="px-6 py-4">{regionStat.averageResponseTime.toFixed(0)} ms</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
{/* SSL & Region Info */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white/70">SSL Expiry</h4>
                    {/* <p className="text-lg font-semibold mt-1">{stats?.sslInfo ? `${formatDistanceToNow(stats.sslInfo.expiresAt)} from now` : 'Checking...'}</p> */}
                    <p>Not yet built</p>
                </div>
                 <div className="bg-[#131211] border border-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white/70">Domain Expiry</h4>
                    {/* <p className="text-lg font-semibold mt-1">Checking...</p> */}
                    <p>Not yet built</p>
                </div>
            </div>

            {/* Recent Incidents Table */}
             <div className="bg-[#131211] border border-white/10 rounded-lg">
                <h3 className="font-semibold p-4">Recent Incidents</h3>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase border-t border-white/10">
                        <tr>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Started</th>
                            <th scope="col" className="px-6 py-3">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats?.recentIncidents && stats.recentIncidents.length > 0 ? stats.recentIncidents.map(incident => (
                            <tr key={incident._id} className="border-t border-white/10">
                                <td className="px-6 py-4 capitalize">{incident.status}</td>
                                <td className="px-6 py-4">{format(new Date(incident.startedAt), 'MMM d, yyyy HH:mm')}</td>
                                
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-sm text-white/50">No incidents in this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}