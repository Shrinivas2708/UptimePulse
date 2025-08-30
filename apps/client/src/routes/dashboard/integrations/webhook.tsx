import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIntegrations, createIntegration, deleteIntegration, IIntegration } from '../../../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/integrations/webhook')({
  component: WebhookComponent,
});

const webhookSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid webhook URL."),
});
type WebhookFormData = z.infer<typeof webhookSchema>;

function WebhookComponent() {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading } = useQuery<IIntegration[]>({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  const webhookIntegration = integrations?.find(int => int.type === 'webhook');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
  });

  const { mutate: addWebhook, isPending: isAdding } = useMutation({
    mutationFn: (data: WebhookFormData) => createIntegration({
      name: 'Generic Webhook',
      type: 'webhook',
      details: { webhookUrl: data.webhookUrl },
    }),
    onSuccess: () => {
      toast.success("Webhook added successfully!");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      reset();
    },
    onError: (err) => toast.error(err.message || "Failed to add webhook."),
  });

  const { mutate: removeWebhook } = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      toast.success("Webhook removed.");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err) => toast.error(err.message || "Failed to remove webhook."),
  });

  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Webhook Notifications</h2>
        <p className="text-sm text-white/50 mt-1">
         To receive webhook notifications, provide a webhook URL. We'll send POST requests to this URL.
        </p>
      </div>

      {isLoading ? <p>Loading...</p> : webhookIntegration ? (
        <div>
            <p className="text-sm">Current status: <span className="font-semibold text-green-400">Connected to</span> <span className="text-xs text-white/50 truncate">{webhookIntegration.details.webhookUrl}</span></p>
            <button
                onClick={() => removeWebhook(webhookIntegration._id)}
                className="mt-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-md"
            >
                Remove
            </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(data => addWebhook(data))} className="space-y-4">
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
    </div>
  );
}