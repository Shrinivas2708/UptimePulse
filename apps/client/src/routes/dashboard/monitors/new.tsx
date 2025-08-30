import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMonitor, fetchUserProfile } from '../../../api';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AxiosError } from 'axios';

// Zod schema for comprehensive form validation
const monitorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long."),
  url: z.string().url("Please enter a valid URL starting with http:// or https://"),
  interval: z.coerce.number().min(60, "Interval must be at least 1 minute."),
  locations: z.array(z.string()).nonempty("Please select at least one location."),
  // ✨ FIX: This ensures the type is always boolean after validation
  notifyOnFailure: z.boolean(),
});

type MonitorFormData = z.infer<typeof monitorSchema>;

export const Route = createFileRoute('/dashboard/monitors/new')({
  component: CreateMonitorComponent,
});

function CreateMonitorComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
  
  const isPro = userProfile?.tier === 'pro' || userProfile?.subscription.planType === 'lifetime';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(monitorSchema),
    defaultValues: {
      interval: 300,
      locations: ['na_west'], // Default location
      notifyOnFailure: true,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createMonitor,
    onSuccess: () => {
      toast.success("Monitor created successfully!");
      queryClient.invalidateQueries({ queryKey: ["userMonitors", "monitorSummary"] });
      navigate({ to: '/dashboard/monitors' });
    },
    onError: ( err) => {
      if(err instanceof AxiosError) toast.error(err.response?.data || "Failed to create monitor.");
      toast.error(err.message)
    },
  });

  // ✨ FIX: Explicitly type the data parameter with SubmitHandler
  const onSubmit: SubmitHandler<MonitorFormData> = (data) => {
    // Map form data to the backend IMonitor shape
    const monitorData = {
      name: data.name,
      url: data.url,
      interval: data.interval,
      regions: data.locations,
      type: 'http', // Default to HTTP monitor
    };
    mutate(monitorData);
  };

  const locationOptions = [
    { id: 'na_west', label: 'North America (West)' },
    { id: 'na_east', label: 'North America (East)' },
    { id: 'eu_west', label: 'Europe (West)' },
    { id: 'asia_pacific', label: 'Asia Pacific' },
    { id: 'oceania', label: 'Oceania' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link to="/dashboard/monitors" className="p-2 rounded-md hover:bg-[#292524]">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-sm text-white/50">Monitors &rsaquo; http monitor</p>
          <h1 className="text-3xl font-bold mt-1">Create HTTP Monitor</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Your Monitor Section */}
        <div className="bg-[#131211] border border-white/10 rounded-lg p-6">
          <h2 className="font-semibold text-lg">Your Monitor</h2>
          <p className="text-sm text-white/50 mt-1">Information we need to start monitoring your url.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="name" className="text-sm">Name</label>
              <input id="name" {...register('name')} className="input-style w-full mt-2" placeholder="My Awesome Website" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="url" className="text-sm">URL</label>
              <input id="url" {...register('url')} className="input-style w-full mt-2" placeholder="https://" />
              {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Frequency Section */}
        <div className="bg-[#131211] border border-white/10 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
                <h2 className="font-semibold text-lg">Frequency</h2>
                <p className="text-sm text-white/50 mt-1">Frequency for checking url.</p>
            </div>
             <p className={`text-xs text-yellow-400 ${isPro?"hidden":""} `}>1 min freq available in paid plans <Link to="/dashboard/settings" className="underline">upgrade now</Link></p>
          </div>
           <Controller
                name="interval"
                control={control}
                render={({ field }) => (
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => field.onChange(60)} disabled={!isPro} className={`px-4 py-2 rounded-md text-sm ${field.value === 60 ? 'bg-white text-black' : 'bg-[#292524]'} disabled:opacity-50`}>1 Min</button>
                        <button type="button" onClick={() => field.onChange(300)} className={`px-4 py-2 rounded-md text-sm ${field.value === 300 ? 'bg-white text-black' : 'bg-[#292524]'}`}>5 Min</button>
                        <button type="button" onClick={() => field.onChange(600)} className={`px-4 py-2 rounded-md text-sm ${field.value === 600 ? 'bg-white text-black' : 'bg-[#292524]'}`}>10 Min</button>
                    </div>
                )}
            />
        </div>

        {/* Monitor Location Section */}
        <div className="bg-[#131211] border border-white/10 rounded-lg p-6">
           <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">Monitor Location</h2>
                 <p className={`text-xs text-yellow-400 ${isPro?"hidden":""} `}>Multi location checks available in paid plans <Link to="/dashboard/settings" className="underline">upgrade now</Link></p>
          </div>
          <p className="text-sm text-white/50 mt-1">Select the locations from which you want to check the monitor</p>
          <Controller
              name="locations"
              control={control}
              render={({ field }) => (
                  <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 mt-4`}>
                      {locationOptions.map(option => (
                          <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox"
                                  className="h-4 w-4 rounded bg-[#0c0a09] border-white/30 text-green-500 focus:ring-green-500"
                                  checked={field.value.includes(option.id)}
                                  onChange={e => {
                                      let newValue = [...field.value];
                                      if (e.target.checked) {
                                          if (isPro || newValue.length === 0) {
                                              newValue.push(option.id);
                                          } else {
                                              e.target.checked = false;
                                              toast.warning("Multi-location checks are a Pro feature.");
                                          }
                                      } else {
                                          newValue = newValue.filter(val => val !== option.id);
                                      }
                                      field.onChange(newValue);
                                  }}
                              />
                              {option.label}
                          </label>
                      ))}
                  </div>
              )}
          />
           {errors.locations && <p className="text-red-500 text-xs mt-2">{errors.locations.message}</p>}
        </div>
        
        {/* Notification Settings Section */}
        <div className="bg-[#131211] border border-white/10 rounded-lg p-6">
          <h2 className="font-semibold text-lg">Notification Settings</h2>
          <p className="text-sm text-white/50 mt-1">Configure how you want to be notified.</p>
           <div className="mt-4">
               <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                    type="checkbox"
                    {...register('notifyOnFailure')}
                    className="h-4 w-4 rounded bg-[#0c0a09] border-white/30 text-green-500 focus:ring-green-500"
                   />
                   Notify via email on failure
               </label>
           </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Creating..." : "Start Monitoring"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}