/* eslint-disable */
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchStatusPageBySlug } from '../../../../api';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { STATUS_PAGE_URL } from '../../../../lib/exports';

export const Route = createFileRoute('/dashboard/status-pages/$slug')({
  loader: ({ params, context }) => {
    // @ts-ignore
    return context.queryClient.ensureQueryData({
      queryKey: ['statusPage', params.slug],
      queryFn: () => fetchStatusPageBySlug(params.slug),
    });
  },
  component: StatusPageDetailLayout,
});

function StatusPageDetailLayout() {
  const { slug } = Route.useParams();
  const initialData = Route.useLoaderData();
  const { data: page } = useQuery({
    queryKey: ['statusPage', slug],
    // ✨ Add the queryFn back in for better type safety
    queryFn: () => fetchStatusPageBySlug(slug),
    initialData,
  });

  // ✨ THIS IS THE FIX ✨
  // Add a check to handle the case where page might be undefined.
  if (!page) {
    return <div>Loading page details...</div>; // Or return a loading spinner
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Link to="/dashboard/status-pages" className="p-2 rounded-md hover:bg-[#292524]">
            <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
            {/* Now it's safe to access page.name and page.slug */}
            <h1 className="text-2xl font-bold">{page.name}</h1>
            <p className="text-sm text-white/50">/status/{page.slug}</p>
            </div>
        </div>
        <a href={`${STATUS_PAGE_URL}/${slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary p-2">
            <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="flex items-center border-b border-white/10">
        <Link to="/dashboard/status-pages/$slug" params={{slug}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}} activeOptions={{exact: true}}>Settings</Link>
        <Link to="/dashboard/status-pages/$slug/monitors" params={{slug}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}}>Monitors</Link>
        <Link to="/dashboard/status-pages/$slug/customizations" params={{slug}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}}>Customizations</Link>
        <Link to="/dashboard/status-pages/$slug/delete" params={{slug}} className="px-4 py-2 text-sm font-medium hover:text-white" activeProps={{className: 'border-b-2 border-green-500 text-white'}} inactiveProps={{className: 'text-white/50'}}>Delete</Link>
      </div>
      
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}