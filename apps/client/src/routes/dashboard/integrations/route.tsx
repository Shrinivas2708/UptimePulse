/*  eslint-disable */
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { fetchUserProfile } from "../../../api";

export const Route = createFileRoute("/dashboard/integrations")({
  loader: ({ context }) => {
    // @ts-ignore
    return context.queryClient.ensureQueryData({
      queryKey: ["userProfile"],
      queryFn: fetchUserProfile,
    });
  },
  component: RouteComponent,
});

const data = [
  {
    name: "Email",
    to: "/dashboard/integrations/email",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="#4A90E2"
        className="w-8 h-8 md:w-6 md:h-6"
        viewBox="0 0 16 16"
      >
        <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586zm3.436-.586L16 11.801V4.697z"></path>
      </svg>
    ),
  },
  {
    name: "Telegram",
    to: "/dashboard/integrations/telegram",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="w-8 h-8 md:w-6 md:h-6"
      >
        <circle cx="8" cy="8" r="8" fill="#0088cc"></circle>
        <path
          d="M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09"
          fill="#ffffff"
        ></path>
      </svg>
    ),
  },
  {
    name: "Discord",
    to: "/dashboard/integrations/discord",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="w-8 h-8 md:w-6 md:h-6"
      >
        <path
          fill="#5865F2"
          d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"
        ></path>
      </svg>
    ),
  },
  {
    name: "Slack",
    to: "/dashboard/integrations/slack",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="w-8 h-8 md:w-6 md:h-6"
      >
        <path
          fill="#E01E5A"
          d="M3.362 10.11c0 .926-.756 1.681-1.681 1.681S0 11.036 0 10.111.756 8.43 1.68 8.43h1.682v1.68zm.846 0c0-.924.756-1.68 1.681-1.68s1.681.756 1.681 1.68v4.21c0 .924-.756 1.68-1.68 1.68a1.685 1.685 0 0 1-1.682-1.68v-4.21zM5.89 3.362c-.926 0-1.682-.756-1.682-1.681S4.964 0 5.89 0s1.68.756 1.68 1.68v1.682H5.89z"
        ></path>
        <path
          fill="#36C5F0"
          d="M5.89 4.208c.924 0 1.68.756 1.68 1.681S6.814 7.57 5.89 7.57H1.68C.757 7.57 0 6.814 0 5.89c0-.926.756-1.682 1.68-1.682h4.21z"
        ></path>
        <path
          fill="#2EB67D"
          d="M12.638 5.89c0-.926.755-1.682 1.68-1.682S16 4.964 16 5.889s-.756 1.681-1.68 1.681h-1.682V5.89z"
        ></path>
        <path
          fill="#ECB22E"
          d="M11.79 5.89c0 .924-.755 1.68-1.68 1.68a1.685 1.685 0 0 1-1.682-1.68V1.68C8.43.757 9.186 0 10.11 0c.926 0 1.681.756 1.681 1.68v4.21zm0 6.748c.926 0 1.682.756 1.682 1.681S12.716 16 11.79 16s-1.681-.756-1.681-1.68v-1.682h1.68z"
        ></path>
        <path
          fill="#2EB67D"
          d="M11.79 11.791c-.924 0-1.68-.755-1.68-1.68s.756-1.681 1.68-1.681h4.21c.924 0 1.68.756 1.68 1.68 0 .926-.756 1.681-1.68 1.681h-4.21z"
        ></path>
      </svg>
    ),
  },
  {
    name: "Teams",
    to: "/dashboard/integrations/teams",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="w-8 h-8 md:w-6 md:h-6"
      >
        <path
          d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z"
          fill="#5059C9"
        ></path>
        <path
          d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z"
          fill="#7B83EB"
        ></path>
      </svg>
    ),
  },
  {
    name: "Webhook",
    to: "/dashboard/integrations/webhook",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-webhook w-8 h-8 md:w-6 md:h-6"
      >
        <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path>
        <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path>
        <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path>
      </svg>
    ),
  },
  {
    name: "Google Chat",
    icon: (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 479.4 500"
        className="w-8 h-8 md:w-6 md:h-6"
      >
        <path
          fill="#00AC47"
          d="M108.8,269.7V107.2h-71C16.9,107.2,0,124.2,0,145.1V481c0,16.9,20.4,25.3,32.3,13.4l78.1-78.1h222.4 c20.9,0,37.8-16.9,37.8-37.8v-71H146.7C125.8,307.5,108.8,290.6,108.8,269.7z"
        ></path>
        <path
          fill="#5BB974"
          d="M441.6,0H146.7c-20.9,0-37.8,16.9-37.8,37.8v69.4h223.9c20.9,0,37.8,16.9,37.8,37.8v162.4h71 c20.9,0,37.8-16.9,37.8-37.8V37.8C479.4,16.9,462.5,0,441.6,0z"
        ></path>
        <path
          fill="#00832D"
          d="M332.8,107.2H108.8v162.4c0,20.9,16.9,37.8,37.8,37.8h223.9V145.1C370.6,124.2,353.7,107.2,332.8,107.2z"
        ></path>
      </svg>
    ),
    to: "/dashboard/integrations/googlechat",
  },
  {
    name: "Twilio SMS",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        className="w-8 h-8 md:w-6 md:h-6"
      >
        <path
          fill="#F22F46"
          d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 87.5C29.3 87.5 12.5 70.7 12.5 50S29.3 12.5 50 12.5 87.5 29.3 87.5 50 70.7 87.5 50 87.5z"
        ></path>
        <circle fill="#F22F46" cx="34.7" cy="34.7" r="8.8"></circle>
        <circle fill="#F22F46" cx="65.3" cy="34.7" r="8.8"></circle>
        <circle fill="#F22F46" cx="34.7" cy="65.3" r="8.8"></circle>
        <circle fill="#F22F46" cx="65.3" cy="65.3" r="8.8"></circle>
      </svg>
    ),
    to: "/dashboard/integrations/twiliosms",
  },
  {
    name: "PagerDuty",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="#25c151"
        viewBox="0 0 64 64"
        className="w-8 h-8 md:w-6 md:h-6"
      >
        <path d="M6.704 59.217H0v-33.65c0-3.455 1.418-5.544 2.604-6.704 2.63-2.58 6.2-2.656 6.782-2.656h10.546c3.765 0 5.93 1.52 7.117 2.8 2.346 2.553 2.372 5.853 2.32 6.73v12.687c0 3.662-1.496 5.828-2.733 6.988-2.553 2.398-5.93 2.45-6.73 2.424H6.704zm13.46-18.102c.36 0 1.367-.103 1.908-.62.413-.387.62-1.083.62-2.1v-13.02c0-.36-.077-1.315-.593-1.857-.5-.516-1.444-.62-2.166-.62h-10.6c-2.63 0-2.63 1.985-2.63 2.656v15.55zM57.296 4.783H64V38.46c0 3.455-1.418 5.544-2.604 6.704-2.63 2.58-6.2 2.656-6.782 2.656H44.068c-3.765 0-5.93-1.52-7.117-2.8-2.346-2.553-2.372-5.853-2.32-6.73V25.62c0-3.662 1.496-5.828 2.733-6.988 2.553-2.398 5.93-2.45 6.73-2.424h13.202zM43.836 22.9c-.36 0-1.367.103-1.908.62-.413.387-.62 1.083-.62 2.1v13.02c0 .36.077 1.315.593 1.857.5.516 1.444.62 2.166.62h10.598c2.656-.026 2.656-2 2.656-2.682V22.9z"></path>
      </svg>
    ),
    to: "/dashboard/integrations/pagerduty",
  },
];
function RouteComponent() {
  // const path = useLocation().pathname.split("/")
  
  const [active, setActive] = useState<string>(useLocation().pathname.split("/")[useLocation().pathname.split("/").length-1].charAt(0).toUpperCase() +useLocation().pathname.split("/")[useLocation().pathname.split("/").length-1].slice(1));
  return (
    <main className=" space-y-5">
      <h1 className="text-3xl font-bold">Integrations</h1>
      <div className="flex md:flex-row flex-col  gap-3 md:gap-5 ">
        <div className="flex flex-col ">
          {data.map((v, i) => {
            return (
              <Link
                to={v.to}
                className=" flex gap-2 p-2 cursor-pointer items-center"
                key={i}
                onClick={() => setActive(v.name)}
              >
                <div>{v.icon}</div>
                <p
                  className={
                    active == v.name ? "text-green-500" : "text-white/50"
                  }
                >
                  {v.name}
                </p>
              </Link>
            );
          })}
        </div>
          <div>
          <Outlet />
          </div>
      </div>
    </main>
  );
}
