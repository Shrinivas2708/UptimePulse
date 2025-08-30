import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/incidents')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet/>
}
