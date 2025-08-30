import { createFileRoute } from '@tanstack/react-router';
import { Bot } from 'lucide-react';

export const Route = createFileRoute('/dashboard/integrations/telegram')({
  component: TelegramComponent,
});

function TelegramComponent() {
  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Telegram Notifications</h2>
        <p className="text-sm text-white/50 mt-1">
          Connect your Telegram account to receive instant uptime and downtime alerts.
        </p>
      </div>

      <div className="text-center py-12 bg-[#1c1917] rounded-lg border border-dashed border-white/20 flex flex-col items-center">
        <Bot className="h-12 w-12 text-sky-400" />
        <h3 className="mt-4 text-lg font-semibold">Feature Coming Soon!</h3>
        <p className="mt-1 text-sm text-white/60 max-w-xs">
          We are currently building our custom Telegram bot for seamless notifications. This feature will be available shortly.
        </p>
      </div>
    </div>
  );
}
