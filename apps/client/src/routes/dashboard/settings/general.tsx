/* eslint-disable */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { fetchUserProfile, updateUserProfile, createRazorpayOrder, verifyRazorpayPayment, type UserProfile } from '../../../api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { z } from 'zod';

// Dynamically load Razorpay script
const loadRazorpayScript = (src: string) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};  

// Define and validate the search params from the URL
const settingsSearchSchema = z.object({
  plan: z.enum(['pro', 'lifetime']).optional(),
});

export const Route = createFileRoute('/dashboard/settings/general')({
  validateSearch: settingsSearchSchema,
  component: SettingsComponent,
});

function SettingsComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { plan } = Route.useSearch(); // Get the plan from the URL

  const { data: userProfile, isLoading } = useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  const { register, handleSubmit, setValue } = useForm<{ name: string }>();

  useEffect(() => {
    if (userProfile?.name) setValue("name", userProfile.name);
  }, [userProfile, setValue]);

  // Automatically trigger payment if a plan is in the URL
  useEffect(() => {
    if (plan && userProfile) {
      displayRazorpay(plan);
      // Clean the URL so it doesn't trigger again on refresh
      console.log(plan)
      navigate({ to: '/dashboard/settings', search: {}, replace: true });
    }
  }, [plan, userProfile]);

  const { mutate: verifyPaymentMutation } = useMutation({
    mutationFn: verifyRazorpayPayment,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err) => toast.error(err.message || 'Payment verification failed.'),
  });

  const displayRazorpay = async (selectedPlan: 'pro' | 'lifetime') => {
    const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
    }

    try {
        // ✨ FIX: Pass the selected plan to the API call ✨
        const orderData = await createRazorpayOrder(selectedPlan);
        
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: orderData.amount.toString(),
            currency: orderData.currency,
            name: 'UptimePulse',
            description: `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`,
            order_id: orderData.orderId,
            handler: function (response: any) {
                verifyPaymentMutation({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
            },
            prefill: {
                name: userProfile?.name,
                email: userProfile?.email,
            },
            theme: { color: '#22c55e' }
        };
        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
    } catch (error: any) {
        toast.error(error.response?.data?.error || 'Could not initiate payment.');
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err) => toast.error(err.message),
  });
  
  const onProfileSubmit = (data: { name: string }) => mutate({ name: data.name });
  
  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="bg-[#131211] border border-white/10 rounded-lg p-6">
        <h2 className="font-bold text-xl mb-4">Profile</h2>
        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="text-sm text-white/70">Full Name</label>
            <input {...register("name")} className="input-style mt-1" />
          </div>
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input value={userProfile?.email} className="input-style mt-1" disabled />
          </div>
          <div className="text-right">
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <div className="bg-[#131211] border border-white/10 rounded-lg p-6">
        <h2 className="font-bold text-xl mb-4">Plan & Billing</h2>
        <div className="space-y-3">
          <p>You are currently on the <span className="font-bold capitalize text-green-400">{userProfile?.tier}</span> plan.</p>
          <p>Monitors limit: {userProfile?.limits.monitors}</p>
        </div>
         <div className="text-right mt-4">
            {userProfile?.tier === 'free' ? (
                // ✨ FIX: Pass 'pro' plan when the button is clicked ✨
                (<button onClick={() => displayRazorpay('pro')} className='btn-primary'>Upgrade to Pro
                                  </button>)
            ) : (
                <p className="text-green-400">You are on a paid plan!</p>
            )}
          </div>
      </div>
    </div>
  )
}