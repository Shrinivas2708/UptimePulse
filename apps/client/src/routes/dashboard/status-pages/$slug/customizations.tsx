import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IStatusPage,
  updateStatusPage,
  addCustomDomain,
  verifyCustomDomain,
  getCustomDomain,
  deleteCustomDomain,
} from "../../../../api";
import { toast } from "sonner";
import { Route as parentRoute } from "./route";
import { Clipboard, CheckCircle, Info, Loader2, Trash2 } from "lucide-react";
import { AxiosError } from "axios";

// DNS Record Helper Component
const DnsRecord = ({
  type,
  name,
  value,
}: {
  type: string;
  name: string;
  value: string;
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy.");
      });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-sm bg-[#292524]/50 p-4 rounded-md ">
      <div className="font-mono text-white/60 md:col-span-1 ">{type}</div>
      <div className="flex items-center gap-4 md:col-span-2 ">
        <span className="font-mono text-white/80 truncate">{name}</span>
        <button
          type="button"
          onClick={() => copyToClipboard(name)}
          className="ml-auto p-2 text-white/50 hover:text-white transition-colors"
        >
          <Clipboard size={16} />
        </button>
      </div>
      <div className="flex items-center gap-4 md:col-span-2 ">
        <span className="font-mono text-white/80 truncate">{value}</span>
        <button
          type="button"
          onClick={() => copyToClipboard(value)}
          className="ml-auto p-2 text-white/50 hover:text-white transition-colors"
        >
          <Clipboard size={16} />
        </button>
      </div>
    </div>
  );
};

export const Route = createFileRoute(
  "/dashboard/status-pages/$slug/customizations"
)({
  component: CustomizationsComponent,
});

function CustomizationsComponent() {
  const { slug } = Route.useParams();
  const page = parentRoute.useLoaderData();
  const queryClient = useQueryClient();

  // Fetch and manage the custom domain state
  const { data: customDomain, isLoading: isLoadingDomain } = useQuery({
    queryKey: ["customDomain", slug],
    queryFn: () => getCustomDomain(slug),
  });

  const { register, handleSubmit, getValues } = useForm({
    defaultValues: {
      branding: {
        customCss: page.branding?.customCss || "",
      },
      customJs: page.customJs || "",
      customDomain: "",
    },
  });

  // Mutations for updating customizations, adding, verifying, and removing domains
  const { mutate: saveCustomizations, isPending: isSaving } = useMutation({
    mutationFn: (data: Partial<IStatusPage>) => updateStatusPage(slug, data),
    onSuccess: (updatedPage) => {
      toast.success("Customizations saved!");
      queryClient.setQueryData(["statusPage", slug], updatedPage);
    },
    onError: (err) =>{ 
      if(err instanceof AxiosError) toast.error(err.response?.data?.error || "Failed to remove domain.")
    }
  });

  const { mutate: addDomain, isPending: isAddingDomain } = useMutation({
    mutationFn: (domain: string) => addCustomDomain(page._id, domain),
    onSuccess: () => {
      toast.success("Domain added! Please follow the steps below to verify.");
      queryClient.invalidateQueries({ queryKey: ["customDomain", slug] });
    },
    onError: (err) =>{ 
      if(err instanceof AxiosError) toast.error(err.response?.data?.error || "Failed to remove domain.")
    }
  });

  const { mutate: verify, isPending: isVerifying } = useMutation({
    mutationFn: (domain: string) => verifyCustomDomain(domain),
    onSuccess: () => {
      toast.success("Domain verified successfully!");
      queryClient.invalidateQueries({ queryKey: ["customDomain", slug] });
    },
    onError: (err) =>{ 
      if(err instanceof AxiosError) toast.error(err.response?.data?.error || "Failed to remove domain.")
    }
  });
  
  const { mutate: removeDomain, isPending: isRemovingDomain } = useMutation({
    mutationFn: (domain: string) => deleteCustomDomain(domain),
    onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['customDomain', slug] });
    },
    onError: (err) =>{ 
      if(err instanceof AxiosError) toast.error(err.response?.data?.error || "Failed to remove domain.")
    }
  });

  const onAddDomainSubmit = () => {
    const domain = getValues("customDomain");
    if (!domain) {
      toast.error("Please enter a domain name.");
      return;
    }
    addDomain(domain);
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit((data) => saveCustomizations(data))}
        className="space-y-8"
      >
        {/* --- Custom Domain Section --- */}
        <div className="bg-[#131211] border border-white/10 rounded-lg p-8 max-w-3xl space-y-6">
          <h3 className="font-semibold text-lg">Custom Domain</h3>
          <p className="text-sm text-white/50">
            Point a custom domain (e.g., status.yourcompany.com) to this status
            page.
          </p>
          {isLoadingDomain ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-white/50" />
            </div>
          ) : !customDomain ? (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <input
                {...register("customDomain")}
                className="input-style w-full"
                placeholder="status.yourcompany.com"
              />
              <div className="flex justify-end">
                <button
                type="button"
                onClick={onAddDomainSubmit}
                className="btn-primary text-xs text-center md:py-0 text-nowrap"
                disabled={isAddingDomain}
              >
                {isAddingDomain ? "Adding..." : "Add Domain"}
              </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 border-t border-white/10 pt-6">
              {customDomain.verified ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{customDomain.domain}</p>
                    <div className="flex items-center gap-2 text-xs text-green-400 mt-2">
                      <CheckCircle size={14} />
                      <span>Configuration successful and active.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDomain(customDomain.domain)}
                    className="btn-secondary !bg-red-500/10 !text-red-400"
                    disabled={isRemovingDomain}
                  >
                    <Trash2 size={16} />{" "}
                    {isRemovingDomain ? "Removing..." : "Remove"}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-md">
                      Finish your domain setup
                    </h4>
                    <p className="text-sm text-white/50 mt-2">
                      Log in to your domain provider (e.g., GoDaddy,
                      Namecheap, Cloudflare) and add the following two DNS
                      records.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <DnsRecord
                      type="CNAME"
                      name={customDomain.domain}
                      value="cname.vercel-dns.com"
                    />
                    <DnsRecord
                      type="TXT"
                      name={`uptimepulse-verify.${customDomain.domain}`}
                      value={`uptimepulse-verify=${customDomain.verificationToken}`}
                    />
                  </div>
                  <div className="text-xs text-white/40 pt-2 flex items-center gap-2">
                    <Info size={14} /> For root domains (e.g.,
                    yourdomain.com), use an 'A' record pointing to
                    `76.76.21.21` instead of the CNAME.
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => removeDomain(customDomain.domain)}
                      className="text-sm text-red-400 hover:underline"
                      disabled={isRemovingDomain}
                    >
                      {isRemovingDomain
                        ? "Removing..."
                        : "Cancel and remove domain"}
                    </button>
                    <button
                      type="button"
                      onClick={() => verify(customDomain.domain)}
                      className="btn-primary"
                      disabled={isVerifying}
                    >
                      {isVerifying ? "Verifying..." : "Verify Configuration"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Custom CSS & JS Sections --- */}
        <div className="bg-[#131211] border border-white/10 rounded-lg p-8 max-w-3xl space-y-6">
          <h3 className="font-semibold text-lg">Custom CSS</h3>
          <p className="text-sm text-white/50">
            Add custom CSS to your status page. This will be injected into a
            &lt;style&gt; tag.
          </p>
          <textarea
            {...register("branding.customCss")}
            className="input-style w-full min-h-[200px] font-mono"
            placeholder="body { background-color: #000; }"
          />
        </div>
        <div className="bg-[#131211] border border-white/10 rounded-lg p-8 max-w-3xl space-y-6">
          <h3 className="font-semibold text-lg">Custom JS</h3>
          <p className="text-sm text-white/50">
            Add custom JavaScript to your status page. This will be injected
            into a &lt;script&gt; tag.
          </p>
          <textarea
            {...register("customJs")}
            className="input-style w-full min-h-[200px] font-mono"
            placeholder={`console.log("Hello from status page!");`}
          />
        </div>

        {/* --- Save Button --- */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Customizations"}
          </button>
        </div>
      </form>
    </div>
  );
}