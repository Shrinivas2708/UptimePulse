import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMonitor } from "../../../../api";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
// import ConfirmationModal from "../../../../components/ConfirmationModal";
import { useState } from "react";
import { ConfirmationModal } from "../../../../components/ConfirmModel";

export const Route = createFileRoute("/dashboard/monitors/$monitorId/delete")({
  component: DeleteComponent,
});

function DeleteComponent() {
  const { monitorId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteMonitor,
    onSuccess: () => {
      toast.success("Monitor deleted successfully.");
      queryClient.invalidateQueries({
        queryKey: ["userMonitors", "monitorSummary"],
      });
      navigate({ to: "/dashboard/monitors" });
    },
    onError: (err) => toast.error(err.message || "Failed to delete monitor."),
  });

  const handleDelete = () => {
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    mutate(monitorId);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6 max-w-2xl">
      <h3 className="font-semibold text-lg text-red-500">Delete Monitor</h3>
      <p className="text-sm text-white/50 mt-1">
        This action is irreversible. All historical data for this monitor will
        be lost.
      </p>
      <div className="mt-4">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isPending ? "Deleting..." : "Delete Permanently"}
        </button>
      </div>
      <ConfirmationModal
        isOpen={showModal}
        title="Delete Monitor"
        message="Are you sure you want to delete this monitor? This action cannot be undone."
        onConfirm={handleConfirm}
        // onCancel={handleCancel}
        onClose={handleCancel}
        confirmText="Delete"
        // confirmColor="red"
        // loading={isPending}
        isDestructive
      />
    </div>
  );
}
