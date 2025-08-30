import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IStatusPage, updateStatusPage } from '../../../../api';
import { toast } from 'sonner';
import { Route as parentRoute } from './route';

export const Route = createFileRoute('/dashboard/status-pages/$slug/')({
  component: SettingsComponent,
});

function SettingsComponent() {
  const { slug } = Route.useParams();
  const page = parentRoute.useLoaderData();
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: page.name || '',
      branding: {
        logoUrl: page.branding?.logoUrl || '',
        logoRedirectUrl: page.branding?.logoRedirectUrl || '',
        faviconUrl: page.branding?.faviconUrl || '',
      },
      degradedThreshold: page.degradedThreshold || 100,
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Partial<IStatusPage>) => updateStatusPage(slug, data),
    onSuccess: (updatedPage) => {
      toast.success("Settings updated!");
      queryClient.setQueryData(['statusPage', slug], updatedPage);
    },
    onError: (err) => toast.error(err.message || "Failed to update."),
  });

  return (
    <form onSubmit={handleSubmit(data => mutate(data))} className="bg-[#131211] border border-white/10 rounded-lg p-6 max-w-3xl space-y-4">
      <div>
        <label className="text-sm text-white/70">Page Name</label>
        <input 
            {...register('name')} 
            className="input-style w-full mt-1" 
            placeholder="Explorer"
        />
      </div>
      <div>
        <label className="text-sm text-white/70">Logo URL</label>
        <input 
            {...register('branding.logoUrl')} 
            className="input-style w-full mt-1"
            placeholder="https://public.uptimebeats.com/logo.svg"
        />
      </div>
      <div>
        <label className="text-sm text-white/70">Logo click destination URL</label>
        <input 
            {...register('branding.logoRedirectUrl')} 
            className="input-style w-full mt-1"
            placeholder="https://uptimebeats.com"
        />
      </div>
      <div>
        <label className="text-sm text-white/70">Favicon URL</label>
        <input 
            {...register('branding.faviconUrl')} 
            className="input-style w-full mt-1"
            placeholder="https://public.uptimebeats.com/favicon.ico"
        />
      </div>
      <div>
        <label className="text-sm text-white/70">Degraded Value</label>
        <input 
            type="number" 
            {...register('degradedThreshold')} 
            className="input-style w-full mt-1"
            placeholder="100"
        />
        <p className="text-xs text-white/50 mt-1">Enter the value under which the status page will show uptime as degraded.</p>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Saving...' : 'Update Status Page'}
        </button>
      </div>
    </form>
  );
}