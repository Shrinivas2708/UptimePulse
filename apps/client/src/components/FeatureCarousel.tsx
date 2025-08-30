import { useState, useEffect } from "react";

// --- Custom Hook for Responsive Logic ---
// This hook determines how many cards to show based on the window width.
const useResponsiveCards = () => {
  const getCardsPerPage = () => {
    if (typeof window === "undefined") {
      return 3; // Default for server-side rendering
    }
    if (window.innerWidth < 768) {
      return 1; // Mobile
    }
    if (window.innerWidth < 1024) {
      return 2; // Tablet
    }
    return 3; // Desktop
  };

  const [cardsPerPage, setCardsPerPage] = useState(getCardsPerPage());

  useEffect(() => {
    const handleResize = () => {
      setCardsPerPage(getCardsPerPage());
    };

    window.addEventListener("resize", handleResize);
    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return cardsPerPage;
};

// --- Feature Data ---
const features = [
  {
    title: "Advanced Uptime Monitoring",
    description:
      "Monitor any URL or API with custom methods, headers, and bodies. Get alerted on downtime and performance degradation.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: "Go Beyond Pings",
    description:
      "Monitor any URL or API endpoint with custom methods (GET, POST), headers, and request bodies.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Performance Thresholds",
    description:
      "Get alerted not just for downtime, but for degraded performance when response times exceed your limits.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "SSL Certificate Monitoring",
    description:
      "We automatically watch your SSL certificates and notify you days before they expire, preventing security warnings and protecting user trust.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    ),
  },
  {
    title: "Branded Status Pages",
    description:
      "Communicate with clarity. Host a status page on your domain with your logo, favicon, and custom colors to build user trust.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: "Custom Domains",
    description:
      "Host your status page on your own domain (e.g., status.yourcompany.com) for a seamless brand experience.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 010 20" />
        <path d="M12 2a15.3 15.3 0 000 20" />
      </svg>
    ),
  },
  {
    title: "Your Brand, Your Page",
    description:
      "Add your logo, favicon, and custom colors to make your status page a true extension of your brand.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    title: "Build User Trust",
    description:
      "Display real-time uptime percentages, response time charts, and a full incident history to keep your users informed and confident in your service.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    title: "Instant, Multi-Channel Alerts",
    description:
      "Know about issues the moment they happen. Receive immediate alerts via email, SMS, Slack, and Discord integrations.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    title: "Email & SMS Notifications",
    description:
      "Receive immediate alerts via email and SMS so you can react quickly.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    title: "Customizable Triggers",
    description:
      "Fine-tune your alerts. Get notified on downtime, when a service is back up, or when it's performing poorly.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: "Scheduled Maintenance",
    description:
      "Plan ahead for maintenance windows to pause monitoring and avoid false alarms, keeping your uptime stats clean and accurate.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Invite Team Members",
    description:
      "Collaborate with your team by inviting members to your monitoring dashboard with role-based access control.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: "Response Time Monitoring",
    description:
      "Track and visualize response times with detailed charts to identify performance issues before they escalate.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Custom HTTP Requests",
    description:
      "Create and monitor custom HTTP headers and payloads to ensure your complex API endpoints are working correctly.",
    icon: (
      <svg
        className="w-7 h-7 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
];

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

function FeatureCarousel() {
  const cardsPerPage = useResponsiveCards();
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(features.length / cardsPerPage);

  // Reset page to 0 if totalPages changes to prevent out-of-bounds errors
  useEffect(() => {
    setPage(0);
  }, [totalPages]);

  // --- Automatic Sliding Logic ---
  useEffect(() => {
    const timer = setInterval(() => {
      setPage((prevPage) => (prevPage + 1) % totalPages);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [totalPages]);

  const startIdx = page * cardsPerPage;
  const visibleFeatures = features.slice(startIdx, startIdx + cardsPerPage);

  const goToPage = (idx: number) => {
    setPage(idx);
  };

  const prevPage = () => {
    setPage((p) => (p === 0 ? totalPages - 1 : p - 1));
  };

  const nextPage = () => {
    setPage((p) => (p + 1) % totalPages);
  };

  return (
    <section className="flex flex-col items-center justify-center pt-10 w-full px-4">
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center">
        {visibleFeatures.map((feature, index) => (
          <div
            key={`${feature.title}-${index}`}
            className="bg-[#141210] rounded-2xl px-7 py-8 md:p-5 flex flex-col items-start w-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {feature.title}
              </h3>
            </div>
            <p className="text-white/60 text-base">{feature.description}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6 mt-10">
        <button
          onClick={prevPage}
          className="rounded-full p-2 bg-[#181818] hover:bg-green-500/20 text-white border border-white/10 transition-all duration-300"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === page ? "bg-green-500 w-4" : "bg-[#333] w-2"}`}
            />
          ))}
        </div>
        <button
          onClick={nextPage}
          className="rounded-full p-2 bg-[#181818] hover:bg-green-500/20 text-white border border-white/10 transition-all duration-300"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default FeatureCarousel;
