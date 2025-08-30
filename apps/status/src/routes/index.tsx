import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: StatusLandingPageComponent,
});

function StatusLandingPageComponent() {
  return (
    <div className="bg-[#0c0a09] text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <img 
          src="/logo.svg" 
          alt="UptimePulse Logo" 
          className="h-16 w-16 mx-auto mb-6"
        />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          UptimePulse Status Pages
        </h1>
        <p className="mt-4 text-lg text-white/60">
          This is the central hub for all status pages powered by UptimePulse.
          Each page provides real-time updates on the availability of different services.
        </p>
        <p className="mt-2 text-sm text-white/40">
          To view a specific status page, please use the direct URL provided to you.
        </p>
        <div className="mt-8">
          <a
            href="https://uptimepulse.shriii.xyz" // Note: This should be the URL of your main client application
            className="inline-block bg-white text-black font-semibold px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
          >
            Go to UptimePulse Dashboard
          </a>
        </div>
      </div>
      <footer className="absolute bottom-4 text-sm text-white/30">
        Powered by UptimePulse
      </footer>
    </div>
  );
}