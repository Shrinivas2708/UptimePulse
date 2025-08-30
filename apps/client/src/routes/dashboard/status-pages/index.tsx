import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchStatusPages, fetchUserProfile, type IStatusPage } from '../../../api';
import { Plus, FileText } from 'lucide-react';

export const Route = createFileRoute('/dashboard/status-pages/')({
  component: StatusPagesListComponent,
});

function StatusPagesListComponent() {
  const { data: statusPages, isLoading } = useQuery<IStatusPage[]>({
    queryKey: ['statusPages'],
    queryFn: fetchStatusPages,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
  });

  const canCreatePage = (statusPages?.length || 0) < (userProfile?.limits.monitors || 1); 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Status Pages</h1>
            <p className="text-sm text-white/50 mt-1">
                Using {statusPages?.length || 0} of {userProfile?.limits.monitors || 1} available status pages.
            </p>
        </div>
        {canCreatePage && (
            <Link to="/dashboard/status-pages/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Create Status Page
            </Link>
        )}
      </div>

      <div className="bg-[#131211] border border-white/10 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase border-b border-white/10">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Public Link</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center p-6 text-white/50">Loading...</td></tr>
              ) : statusPages && statusPages.length > 0 ? (
                statusPages.map(page => (
                
                  <tr key={page._id} className="hover:bg-[#1c1917] border-b border-white/10 last:border-b-0">
                    <td className="px-6 py-4 font-medium">
                        {/* ✨ THIS IS THE FIX: Make the name a link to the management page ✨ */}
                        <Link 
                            to="/dashboard/status-pages/$slug" 
                            params={{ slug: page.slug }} 
                            className="hover:text-green-400"
                        >
                            {page.name}
                        </Link>
                    </td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">Operational</span></td>
                    <td className="px-6 py-4">
                        <a href={`https://status.uptimepulse.shriii.xyz/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                            status.uptimepulse.shriii.xyz/{page.slug}
                        </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center p-10 text-white/50">
                    <FileText className="mx-auto h-12 w-12 mb-2 text-white/30" />
                    No status pages yet. Let's create one to kickstart your journey.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}