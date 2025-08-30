import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIntegrations, createIntegration, deleteIntegration, type IIntegration, fetchUserProfile } from '../../../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export const Route = createFileRoute('/dashboard/integrations/email')({
  component: EmailIntegrationComponent,
});

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
type EmailFormData = z.infer<typeof emailSchema>;

function EmailIntegrationComponent() {
  const queryClient = useQueryClient();
  const { data: userProfile } = useQuery({ queryKey: ['userProfile'], queryFn: fetchUserProfile });
  const { data: integrations, isLoading } = useQuery<IIntegration[]>({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  // ✨ FIX: Filter out the "Primary Email" from the list of additional emails.
  const additionalEmailIntegrations = integrations?.filter(
    int => int.type === 'email' && int.name !== 'Primary Email'
  ) || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const { mutate: addEmail, isPending: isAdding } = useMutation({
    mutationFn: (data: EmailFormData) => createIntegration({
      name: `Email to ${data.email}`,
      type: 'email',
      details: { email: data.email },
    }),
    onSuccess: () => {
      toast.success("Additional email added!");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      reset();
    },
    onError: (err) => toast.error(err.message || "Failed to add email."),
  });

  const { mutate: removeEmail } = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      toast.success("Email address removed.");
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err) => toast.error(err.message || "Failed to remove email."),
  });

  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Email Notifications</h2>
        <p className="text-sm text-white/50 mt-1">
          You can add up to 2 more email addresses apart from primary emails. We'll send notifications to these emails if any of your monitors go down.
        </p>
      </div>

      <div className="space-y-2">
        <div className="bg-[#0c0a09] p-3 rounded-md border border-dashed border-white/20">
            <p className="font-medium">Primary Emails</p>
            <p className="text-sm text-white/50">{userProfile?.email}</p>
        </div>
         {isLoading ? <p className="text-sm text-white/50">Loading...</p> :
          // ✨ FIX: Map over the correctly filtered list.
          additionalEmailIntegrations.map(int => (
              <div key={int._id} className="flex justify-between items-center bg-[#0c0a09] p-3 rounded-md border border-white/10">
                <div>
                  <p className="font-medium">Additional Email</p>
                  <p className="text-sm text-white/50">{int.details.email}</p>
                </div>
                <button onClick={() => removeEmail(int._id)} className="p-2 hover:bg-[#292524] rounded-md text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
          ))
        }
      </div>

     {additionalEmailIntegrations.length < 2 && (
      <form onSubmit={handleSubmit(data => addEmail(data))} className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input {...register('email')} className="input-style flex-1" placeholder="Enter email address" />
          <button type="submit" className="btn-primary" disabled={isAdding}>
            {isAdding ? 'Adding...' : 'Add Email'}
          </button>
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </form>
     )}
    </div>
  );
}
