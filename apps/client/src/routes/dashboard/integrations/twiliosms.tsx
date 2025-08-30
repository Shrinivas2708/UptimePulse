import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIntegrations, IIntegration, sendTwilioTestSms, deleteIntegration } from '../../../api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { backend_url } from '../../../lib/exports';

export const Route = createFileRoute('/dashboard/integrations/twiliosms')({
  component: TwilioSmsComponent,
});

const testSmsSchema = z.object({
  toNumber: z.string().min(10, "Please enter a valid phone number with country code."),
});
type TestSmsFormData = z.infer<typeof testSmsSchema>;


function TwilioSmsComponent() {
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery<IIntegration[]>({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  const twilioIntegration = integrations?.find(int => int.type === 'twiliosms');

  const { register, handleSubmit, formState: { errors } } = useForm<TestSmsFormData>({
    resolver: zodResolver(testSmsSchema),
  });

  const { mutate: sendTest, isPending: isSending } = useMutation({
    mutationFn: (data: TestSmsFormData) => sendTwilioTestSms(data.toNumber, "UptimePulse Test: Your monitor is DOWN."),
    onSuccess: () => toast.success("Test SMS sent successfully!"),
    onError: (err) => toast.error(err.message || "Failed to send test SMS."),
  });

  const { mutate: disconnect } = useMutation({
    mutationFn: () => deleteIntegration(twilioIntegration!._id),
    onSuccess: () => {
        toast.success("Twilio disconnected.");
        queryClient.invalidateQueries({queryKey: ['integrations']});
    },
    onError: (err) => toast.error(err.message || "Failed to disconnect."),
  });

  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Twilio SMS Notifications</h2>
        <p className="text-sm text-white/50 mt-1">
          Connect your Twilio account to enable SMS notifications. We will purchase a phone number on your behalf.
        </p>
      </div>

       {isLoading ? <p>Loading...</p> : twilioIntegration ? (
        <div className='space-y-6'>
            <div>
                <p className="text-sm">Current status: <span className="font-semibold text-green-400">Connected</span></p>
                <p className="text-xs text-white/50">Sending from: {twilioIntegration.details.fromNumber}</p>
                <button onClick={() => disconnect()} className="mt-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-md">
                    Disconnect Twilio
                </button>
            </div>
            <form onSubmit={handleSubmit(data => sendTest(data))} className="space-y-4 pt-4 border-t border-white/10">
                <h3 className='font-semibold'>Test your Integration</h3>
                <div>
                <label htmlFor="toNumber" className="text-sm">Enter phone number to send SMS to</label>
                <div className="flex items-center gap-2 mt-1">
                    <input {...register('toNumber')} className="input-style flex-1" placeholder="+15551234567" />
                    <button type="submit" className="btn-secondary" disabled={isSending}>
                        {isSending ? 'Sending...' : 'Send Test SMS'}
                    </button>
                </div>
                {errors.toNumber && <p className="text-red-500 text-xs mt-1">{errors.toNumber.message}</p>}
                </div>
            </form>
        </div>
      ) : (
        <div>
            <p className="text-sm">Current status: <span className="text-white/50">Not connected</span></p>
            <a href={`${backend_url}/api/integrations/twilio/connect`} className="btn-primary mt-2 !bg-red-600 hover:!bg-red-700">
                Twilio Connect App
            </a>
        </div>
      )}

      <div className="bg-[#1c1917] p-4 rounded-lg border border-white/10 text-xs text-white/60">
        NOTE: Please do not connect and disconnect multiple times, as Twilio will charge everytime when you buy phone number. For more details, visit Twilio SMS Notifications
      </div>
    </div>
  );
}