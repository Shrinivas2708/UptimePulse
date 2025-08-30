import { createFileRoute, Outlet } from '@tanstack/react-router';

// This component now acts as the layout for all /dashboard/monitors/* routes
export const Route = createFileRoute('/dashboard/monitors')({
  component: MonitorsLayout,
});

function MonitorsLayout() {
  // The Outlet component will render the child route's component
  // e.g., index.tsx, new.tsx, or $monitorId.tsx
  return <Outlet />;
}