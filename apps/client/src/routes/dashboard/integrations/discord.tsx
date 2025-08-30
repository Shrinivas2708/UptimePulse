import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIntegrations, createIntegration, deleteIntegration,type  IIntegration } from '../../../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/integrations/discord')({
  component: DiscordIntegrationComponent,
});

const webhookSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid Discord webhook URL."),
});
type WebhookFormData = z.infer<typeof webhookSchema>;

function DiscordIntegrationComponent() {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading } = useQuery<IIntegration[]>({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  const discordIntegration = integrations?.find(int => int.type === 'discord');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
  });

  const { mutate: addWebhook, isPending: isAdding } = useMutation({
    mutationFn: (data: WebhookFormData) => createIntegration({
      name: 'Discord Webhook',
      type: 'discord',
      details: { webhookUrl: data.webhookUrl },
    }),
    onSuccess: () => {
      toast.success("Discord webhook added successfully!");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      reset();
    },
    onError: (err) => toast.error(err.message || "Failed to add webhook."),
  });

  const { mutate: removeWebhook } = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      toast.success("Discord webhook removed.");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err) => toast.error(err.message || "Failed to remove webhook."),
  });

  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Discord Notifications</h2>
        <p className="text-sm text-white/50 mt-1">
         To receive Discord notifications, provide a webhook URL. We'll send POST requests to this URL.
        </p>
      </div>

      {isLoading ? <p>Loading...</p> : discordIntegration ? (
        <div>
            <p className="text-sm">Current status: <span className="font-semibold text-green-400">Connected</span></p>
            <p className="text-xs text-white/50 truncate">URL: {discordIntegration.details.webhookUrl}</p>
            <button
                onClick={() => removeWebhook(discordIntegration._id)}
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
            <h4 className="font-semibold text-sm">Steps to setup Discord Incoming webhook</h4>
            <ol className="list-decimal list-inside text-xs text-white/60 mt-2 space-y-1">
                <li>Open Server Settings &gt; Integrations.</li>
                <li>Click "Create Webhook", name it, and select a channel.</li>
                <li>Click "Copy Webhook URL" and paste it above.</li>
            </ol>
       </div>
    </div>
  );
}