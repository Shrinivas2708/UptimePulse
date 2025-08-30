import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings/delete")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-[#131211] border border-white/10 rounded-lg p-6">
      <h2 className="font-bold text-xl mb-4">Delete Account</h2>
      <div className="text-white/40">
        <p>Please Contact support if you want to delete your account.</p>
        <p>This action cannot be undone.</p>
      </div>
      <div className=" bg-red-600 inline-flex py-2 px-3 rounded-md gap-2 mt-3 cursor-pointer" onClick={()=> window.open("mailto:ssherikar2005@gmail.com")}>
      <Mail size={20} />
      <p className="text-sm font-semibold">Contact Support</p>
      </div>
    </div>
  );
}
