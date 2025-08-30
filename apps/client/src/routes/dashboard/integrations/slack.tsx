import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIntegrations, createIntegration, deleteIntegration, IIntegration } from '../../../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/integrations/slack')({
  component: SlackIntegrationComponent,
});

const webhookSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid Slack webhook URL."),
});
type WebhookFormData = z.infer<typeof webhookSchema>;

function SlackIntegrationComponent() {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading } = useQuery<IIntegration[]>({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  const slackIntegration = integrations?.find(int => int.type === 'slack');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
  });

  const { mutate: addWebhook, isPending: isAdding } = useMutation({
    mutationFn: (data: WebhookFormData) => createIntegration({
      name: 'Slack Webhook',
      type: 'slack',
      details: { webhookUrl: data.webhookUrl },
    }),
    onSuccess: () => {
      toast.success("Slack webhook added successfully!");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      reset();
    },
    onError: (err) => toast.error(err.message || "Failed to add webhook."),
  });

  const { mutate: removeWebhook } = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      toast.success("Slack webhook removed.");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err) => toast.error(err.message || "Failed to remove webhook."),
  });

  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Slack Notifications</h2>
        <p className="text-sm text-white/50 mt-1">
            To enable Slack notifications, you need to activate Incoming Webhooks. Once activated, simply provide the webhook URL for each Slack channel where you'd like to receive notifications.
        </p>
      </div>

       {isLoading ? <p>Loading...</p> : slackIntegration ? (
        <div>
            <p className="text-sm">Current status: <span className="font-semibold text-green-400">Connected</span></p>
            <p className="text-xs text-white/50 truncate">URL: {slackIntegration.details.webhookUrl}</p>
            <button
                onClick={() => removeWebhook(slackIntegration._id)}
                className="mt-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-md"
            >
                Remove
            </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(data => addWebhook(data))} className="space-y-4">
             <p className="text-sm">Current status: <span className="text-white/50">Not connected</span></p>
            <div className="flex items-center gap-2">
              <input
                {...register('webhookUrl')}
                className="input-style flex-1"
                placeholder="Enter webhook URL"
              />
              <button type="submit" className="btn-primary" disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add Webhook URL'}
              </button>
            </div>
            {errors.webhookUrl && <p className="text-red-500 text-xs mt-1">{errors.webhookUrl.message}</p>}
        </form>
      )}

       <div className="bg-[#1c1917] p-4 rounded-lg border border-white/10">
            <h4 className="font-semibold text-sm">Steps to setup Slack Incoming Webhook</h4>
            <ol className="list-decimal list-inside text-xs text-white/60 mt-2 space-y-1">
                <li>Go to the Incoming Webhooks page in the Slack App Directory.</li>
                <li>Click "Add to Slack" and choose a channel.</li>
                <li>Authorize the integration and copy the generated Webhook URL.</li>
            </ol>
       </div>
    </div>
  );
}