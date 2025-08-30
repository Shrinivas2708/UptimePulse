import { createFileRoute } from '@tanstack/react-router';
import { Hammer } from 'lucide-react';

export const Route = createFileRoute('/dashboard/users')({
  component: UsersComponent,
});

function UsersComponent() {
  return (
    <div className=' '>
      {/* <Hammer size={50} /> */}
      <div className="text-center py-12 bg-[#1c1917] rounded-lg border border-dashed border-white/20 flex flex-col items-center max-w-xl mx-auto ">
        <Hammer className="h-12 w-12 " />
        <h3 className="mt-4 text-lg font-semibold">Feature Coming Soon!</h3>
        <p className="mt-1 text-sm text-white/60 max-w-xs">
          We are currently building this page . This feature will be available shortly.
        </p>
      </div>
    </div>
  );
}
