import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIntegrations, createIntegration, deleteIntegration,type  IIntegration } from '../../../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/integrations/pagerduty')({
  component: PagerDutyComponent,
});

const pagerDutySchema = z.object({
  integrationKey: z.string().min(20, "Please enter a valid PagerDuty integration key."),
});
type PagerDutyFormData = z.infer<typeof pagerDutySchema>;

function PagerDutyComponent() {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading } = useQuery<IIntegration[]>({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  const pagerDutyIntegration = integrations?.find(int => int.type === 'pagerduty');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PagerDutyFormData>({
    resolver: zodResolver(pagerDutySchema),
  });

  const { mutate: addKey, isPending: isAdding } = useMutation({
    mutationFn: (data: PagerDutyFormData) => createIntegration({
      name: 'PagerDuty Integration',
      type: 'pagerduty',
      details: { integrationKey: data.integrationKey },
    }),
    onSuccess: () => {
      toast.success("PagerDuty connected!");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      reset();
    },
    onError: (err) => toast.error(err.message || "Failed to add key."),
  });

  const { mutate: removeKey } = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      toast.success("PagerDuty disconnected.");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err) => toast.error(err.message || "Failed to remove key."),
  });

  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">PagerDuty Notifications</h2>
        <p className="text-sm text-white/50 mt-1">
          Enter your PagerDuty integration key to enable notifications. We will send uptime and downtime events to automatically resolve your incidents in PagerDuty.
        </p>
      </div>

      {isLoading ? <p>Loading...</p> : pagerDutyIntegration ? (
        <div>
          <p className="text-sm">Current status: <span className="font-semibold text-green-400">Connected</span></p>
          <p className="text-xs text-white/50">Integration Key: ************{pagerDutyIntegration.details.integrationKey?.slice(-4)}</p>
           <button onClick={() => removeKey(pagerDutyIntegration._id)} className="mt-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-md">
             Remove
           </button>
        </div>
      ) : (
         <form onSubmit={handleSubmit(data => addKey(data))} className="space-y-4">
            <p className="text-sm">Current status: <span className="text-white/50">Not connected</span></p>
            <div className="flex items-center gap-2">
              <input {...register('integrationKey')} className="input-style flex-1" placeholder="Enter Integration Key" />
               <button type="submit" className="btn-primary whitespace-nowrap" disabled={isAdding}>
                    {isAdding ? 'Adding...' : 'Add Integration Key'}
                </button>
            </div>
            {errors.integrationKey && <p className="text-red-500 text-xs mt-1">{errors.integrationKey.message}</p>}
      </form>
      )}
      
       <div className="bg-[#1c1917] p-4 rounded-lg border border-white/10">
            <h4 className="font-semibold text-sm">Steps to setup PagerDuty Integration</h4>
            <ol className="list-decimal list-inside text-xs text-white/60 mt-2 space-y-1">
                <li>In PagerDuty, go to Services &gt; New Service.</li>
                <li>Under "Integration Settings", select "Events API v2".</li>
                <li>Create the service and copy the generated "Integration Key".</li>
            </ol>
       </div>
    </div>
  );
}