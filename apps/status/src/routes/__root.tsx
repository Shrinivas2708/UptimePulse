import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  // Here, we connect our layout to the Zustand store
  // const { isAuthenticated, logout } = useAuthStore();

  return (
    <>
      <div className="flex-1  ">
        <Outlet />
      </div>
    </>
  );
}
