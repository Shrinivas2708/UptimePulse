import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteStatusPage } from "../../../../api";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmationModal } from "../../../../components/ConfirmModel"; // Adjust import if needed

export const Route = createFileRoute("/dashboard/status-pages/$slug/delete")({
  component: DeleteComponent,
});

function DeleteComponent() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteStatusPage(slug),
    onSuccess: () => {
      toast.success("Status Page deleted.");
      queryClient.invalidateQueries({ queryKey: ["statusPages"] });
      navigate({ to: "/dashboard/status-pages" });
    },
    onError: (err) => toast.error(err.message || "Failed to delete."),
  });

  const handleDelete = () => setShowModal(true);
  const handleConfirm = () => {
    setShowModal(false);
    mutate();
  };
  const handleCancel = () => setShowModal(false);

  return (
    <div className="bg-[#131211] border border-red-500/30 rounded-lg p-6 max-w-2xl">
      <h3 className="font-semibold text-lg text-red-500">Delete Status Page</h3>
      <p className="text-sm text-white/50 mt-1">
        This action is irreversible. Your public status page will be permanently
        removed.
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
        title="Delete Status Page"
        message="Are you sure you want to delete this status page? This action cannot be undone."
        onConfirm={handleConfirm}
        onClose={handleCancel}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
