import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIncidentById, addIncidentUpdate, type IIncident } from '../../../api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useState } from 'react';

export const Route = createFileRoute('/dashboard/incidents/$incidentId')({
  component: IncidentDetailComponent,
});

function IncidentDetailComponent() {
  const { incidentId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State for the new update form
  const [updateMessage, setUpdateMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: incident, isLoading } = useQuery<IIncident>({
    queryKey: ['incident', incidentId],
    queryFn: () => fetchIncidentById(incidentId),
  });

  const { mutate: postUpdate, isPending } = useMutation({
    mutationFn: (update: { message: string; status?: string }) => addIncidentUpdate(incidentId, update),
    onSuccess: () => {
      toast.success('Incident updated!');
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] }); // Refresh the main list
      setUpdateMessage(''); // Clear the form
      // If resolved, go back to the list
      if (newStatus === 'resolved') {
        navigate({ to: '/dashboard/incidents' });
      }
    },
    onError: (err) => toast.error(err.message || 'Failed to post update.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMessage) return;
    postUpdate({ message: updateMessage, status: newStatus });
  };

  if (isLoading || !incident) return <div>Loading incident details...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">{incident.title}</h1>
      <p className="text-white/50">{incident.status.toUpperCase()} - Started {format(new Date(incident.startedAt), 'MMM d, yyyy, HH:mm')}</p>

      {/* Timeline Display */}
      <div className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">Timeline</h2>
        {incident.timeline.map((event, index) => (
          <div key={index} className="border-l-2 border-white/20 pl-4">
            <p className="font-semibold text-sm">{event.message}</p>
            <p className="text-xs text-white/50 mt-1">{format(new Date(event.timestamp), 'MMM d, HH:mm')}</p>
          </div>
        ))}
      </div>
      
      {/* Update Form (only shows for unresolved incidents) */}
      {incident.status !== 'resolved' && (
        <form onSubmit={handleSubmit} className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg">Post an Update</h2>
            <div>
              <label htmlFor="updateMessage" className="text-sm text-white/70">Update Message</label>
              <textarea
                id="updateMessage"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                className="input-style w-full mt-1 min-h-[100px]"
                placeholder="e.g., We have identified the root cause and are working on a fix."
                required
              />
            </div>
            <div>
              <label htmlFor="newStatus" className="text-sm text-white/70">Update Status (Optional)</label>
              <select id="newStatus" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-style w-full mt-1">
                <option value="">Don't change status</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="text-right">
              <button type="submit" className="btn-primary" disabled={isPending}>
                {isPending ? 'Posting...' : 'Post Update'}
              </button>
            </div>
        </form>
      )}
    </div>
  );
}