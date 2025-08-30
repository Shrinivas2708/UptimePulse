import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../store/useAuthStore";
import { CheckCircle2, XCircle } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  period: string;
  planId?:  "pro" | "lifetime";
  features: string[];
  available: boolean[];
  ctaColor: string;
  borderColor: string;
  highlight?: string;
};

 const plansDetails = {
  free: {
    name: "Free",
    price: "₹0",
    period: "month",
  },
  pro: {
    name: "Pro",
    price: "₹499",
    period: "month",
    planId: "pro",
  },
  lifetime: {
    name: "Lifetime",
    price: "₹2,499",
    period: "one-time",
    planId: "lifetime",
  }
} as const;

const plans: Plan[] = [
  {
    ...plansDetails.free,
    features: [
      "5 monitors of 5 min frequency",
      "Single Region HTTP monitoring",
      "1 basic status page",
      "No login seats",
      "24 hrs data retention",
    ],
    available: [true, true, true, false, true],
    ctaColor: "bg-gray-700",
    borderColor: "border-gray-700",
  },
  {
    ...plansDetails.pro,
    features: [
      "10 monitors of 60 sec frequency",
      "6 Region HTTP monitoring",
      "2 fully featured status pages",
      
      "1 login seat included",
      "1 year data retention",
    ],
    available: [true, true, true, true, true],
    ctaColor: "bg-green-500",
    borderColor: "border-gray-700",
  },
  {
    ...plansDetails.lifetime,
    highlight: "Limited time offer",
    features: [
      "Up to 10 monitors of 60 sec frequency",
      "6 Region HTTP monitoring",
      "HTTP, Ping, SSL & Domain Monitors",
      "2 fully featured status pages",
      "1 login seat included",
      "90 days data retention",
      "Access to all upcoming features",
    ],
    available: [true, true, true, true, true, true, true],
    ctaColor: "bg-green-500",
    borderColor: "border-green-500",
  },
];

export default function PricingSection() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleSubscribeClick = (planId: "pro" | "lifetime") => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard/settings', search: { plan: planId } });
    } else {
      navigate({ to: '/signup' });
    }
  };

  
  return (
    <section className="flex flex-col justify-center items-center pt-14 gap-5 px-10 xl:px-32">
      <div className="inline-block px-4 py-1.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-sm font-medium">
        <span>Pricing</span>
      </div>
      <div className="text-3xl md:text-4xl text-center font-semibold space-y-2">
        <p>Simple, transparent pricing </p>
        <p>
          that{" "}
          <span className="text-[#22c55e] bg-[#22c55e]/10 px-2">scales</span>{" "}
          with you.
        </p>
      </div>
      <div className="max-w-xs md:max-w-md text-white/30 text-center text-sm md:text-base">
        <p>
          Join our early supporters and enjoy access forever at a one-time
          price.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 justify-center lg:items-start mt-8 w-full">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative bg-[#1c1917] border ${plan.borderColor} rounded-xl w-full max-w-md p-6 flex flex-col min-h-[0px]`}>
            {plan.highlight && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 text-xs text-white rounded-full bg-green-700">
                {plan.highlight}
              </span>
            )}
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            <div className="my-4">
              <span className="text-4xl font-extrabold text-white">{plan.price}</span>
              <span className="text-white/60 text-sm ml-1">/{plan.period}</span>
            </div>
            <button
              onClick={() => plan.planId ? handleSubscribeClick(plan.planId) : navigate({ to: '/signup' })}
              className={`w-full ${plan.ctaColor} text-white font-semibold py-2 rounded mb-5 hover:opacity-90 transition`}
            >
              {plan.planId ? "Subscribe Now" : "Get Started for Free"}
            </button>
            
            {/* ✨ ADDED THIS SECTION TO DISPLAY FEATURES ✨ */}
            <ul className="flex-1 space-y-3 text-white/90 text-sm">
              {plan.features.map((feature, i) => (
                <li key={feature} className="flex items-start gap-3">
                  {plan.available[i] ? (
                    <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={plan.available[i] ? "" : "line-through text-white/40"}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}