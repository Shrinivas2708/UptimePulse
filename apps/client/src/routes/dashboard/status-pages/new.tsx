// client/src/routes/dashboard/status-pages/new.tsx
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStatusPage } from '../../../api';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { AxiosError } from 'axios';

// Zod schema for validation
const statusPageSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  logoUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  faviconUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

type StatusPageFormData = z.infer<typeof statusPageSchema>;

export const Route = createFileRoute('/dashboard/status-pages/new')({
  component: CreateStatusPageComponent,
});

function CreateStatusPageComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<StatusPageFormData>({
    resolver: zodResolver(statusPageSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createStatusPage,
    onSuccess: () => {
      toast.success("Status page created successfully!");
      queryClient.invalidateQueries({ queryKey: ["statusPages"] });
      navigate({ to: '/dashboard/status-pages' });
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.error || "Failed to create status page.");
      } else {
        toast.error("An unknown error occurred.");
      }
    },
  });

  const onSubmit: SubmitHandler<StatusPageFormData> = (data) => {
    const pageData = {
      name: data.name,
      branding: {
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
      },
    };
    mutate(pageData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link to="/dashboard/status-pages" className="p-2 rounded-md hover:bg-[#292524]">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Status Page</h1>
          <p className="text-sm text-white/50 mt-1">
            Your status page will be created with a unique, unguessable URL.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-[#131211] border border-white/10 rounded-lg p-6">
        <div>
          <label htmlFor="name" className="text-sm">Name</label>
          <input id="name" {...register('name')} className="input-style w-full mt-2" placeholder="My Company Status" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="logoUrl" className="text-sm">Logo Link</label>
          <input id="logoUrl" {...register('logoUrl')} className="input-style w-full mt-2" placeholder="https://..." />
          {errors.logoUrl && <p className="text-red-500 text-xs mt-1">{errors.logoUrl.message}</p>}
        </div>
        <div>
          <label htmlFor="faviconUrl" className="text-sm">Favicon Link</label>
          <input id="faviconUrl" {...register('faviconUrl')} className="input-style w-full mt-2" placeholder="https://..." />
          {errors.faviconUrl && <p className="text-red-500 text-xs mt-1">{errors.faviconUrl.message}</p>}
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Creating..." : "Create Status Page"}
          </button>
        </div>
      </form>
    </div>
  );
}