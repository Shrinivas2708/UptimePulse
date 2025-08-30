/* eslint-disable */
import { createFileRoute, Link } from '@tanstack/react-router'; // Import Link
import { useForm, Controller } from 'react-hook-form'; // Import Controller
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// ✨ Import useQuery and fetchUserProfile
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; 
import { updateMonitorSettings, type IMonitorSettings, fetchUserProfile } from '../../../../api';
import { toast } from 'sonner';
import { Route as parentRoute } from './route'; 

// Zod schema for validation
const settingsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  url: z.string().url("Please enter a valid URL."),
  expectedStatusCodes: z.string().refine(val => {
      if (val === '') return true; 
      return val.split(',').every(item => !isNaN(Number(item.trim())));
  }, { message: "Please enter a comma-separated list of valid numbers."}),
  // ✨ Add interval to the schema
  interval: z.coerce.number().min(60, "Interval must be at least 1 minute."),
});

type MonitorSettingsForm = {
    name: string;
    url: string;
    expectedStatusCodes: string;
    // ✨ Add interval to the form type
    interval: number;
};

export const Route = createFileRoute('/dashboard/monitors/$monitorId/settings')({
  component: SettingsComponent,
});

function SettingsComponent() {
    const { monitorId } = Route.useParams();
    const monitor = parentRoute.useLoaderData();
    const queryClient = useQueryClient();

    // ✨ Fetch user profile to check their plan
    const { data: userProfile } = useQuery({
        queryKey: ["userProfile"],
        queryFn: fetchUserProfile,
    });
    const isPro = userProfile?.tier === 'pro' || userProfile?.subscription.planType === 'lifetime';

    const { register, handleSubmit, control, formState: { errors } } = useForm<MonitorSettingsForm>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: monitor.name,
            url: monitor.url,
            expectedStatusCodes: monitor.expectedStatusCodes?.join(', ') || '',
            // ✨ Set default value for interval
            interval: monitor.interval,
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: (data: IMonitorSettings) => updateMonitorSettings(monitorId, data),
        onSuccess: (updatedMonitor) => {
            toast.success("Settings updated successfully!");
            queryClient.setQueryData(['monitor', monitorId], updatedMonitor);
        },
        onError: (err) => toast.error(err.message || "Failed to update settings."),
    });

    const onSubmit = (data: MonitorSettingsForm) => {
        const formattedData: IMonitorSettings = {
            name: data.name,
            url: data.url,
            interval: data.interval, // ✨ Pass interval to the mutation
            expectedStatusCodes: data.expectedStatusCodes.split(',').map((s: string) => Number(s.trim())).filter(Boolean),
        };
        mutate(formattedData);
    };

    return (
        <div className="bg-[#131211] border border-white/10 rounded-lg p-6 max-w-3xl">
            <h3 className="font-semibold text-lg">Monitor Settings</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <div>
                    <label htmlFor="name" className="text-sm text-white/70">Monitor Name</label>
                    <input id="name" {...register('name')} className="input-style w-full mt-1" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                    <label htmlFor="url" className="text-sm text-white/70">URL</label>
                    <input id="url" {...register('url')} className="input-style w-full mt-1" />
                    {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url.message}</p>}
                </div>

                {/* ✨ FREQUENCY SELECTOR UI ✨ */}
                <div>
                    <label className="text-sm text-white/70">Check Frequency</label>
                    <Controller
                        name="interval"
                        control={control}
                        render={({ field }) => (
                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={() => field.onChange(60)} disabled={!isPro} className={`px-4 py-2 rounded-md text-sm ${field.value === 60 ? 'bg-white text-black' : 'bg-[#292524]'} disabled:opacity-50 disabled:cursor-not-allowed`}>1 Min</button>
                                <button type="button" onClick={() => field.onChange(300)} className={`px-4 py-2 rounded-md text-sm ${field.value === 300 ? 'bg-white text-black' : 'bg-[#292524]'}`}>5 Min</button>
                                <button type="button" onClick={() => field.onChange(600)} className={`px-4 py-2 rounded-md text-sm ${field.value === 600 ? 'bg-white text-black' : 'bg-[#292524]'}`}>10 Min</button>
                            </div>
                        )}
                    />
                    {!isPro && <p className="text-xs text-yellow-400 mt-1">1 min frequency is a Pro feature. <Link to="/dashboard/settings" className="underline">Upgrade now</Link>.</p>}
                    {errors.interval && <p className="text-red-500 text-xs mt-1">{errors.interval.message}</p>}
                </div>

                <div>
                    <label htmlFor="status-codes" className="text-sm text-white/70">Expected Status Codes</label>
                    <input 
                        id="status-codes" 
                        {...register('expectedStatusCodes')} 
                        className="input-style w-full mt-1" 
                        placeholder="e.g., 200, 201, 302"
                    />
                    <p className="text-xs text-white/50 mt-1">Comma-separated. If empty, will default to 2xx.</p>
                    {errors.expectedStatusCodes && <p className="text-red-500 text-xs mt-1">{errors.expectedStatusCodes.message}</p>}
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}