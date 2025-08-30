/*  eslint-disable */
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";
import { Icon } from "../../lib/exports";
import {
  BarChart,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  HelpCircle,
  LoaderCircle,
  LogOut,
  Menu,
  Puzzle,
  Settings,
  ShieldAlert,
  User,
  Users,
  X,
} from "lucide-react";
import { fetchUserProfile } from "../../api";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { name: "Monitors", to: "/dashboard/monitors", icon: BarChart },
  { name: "Incidents", to: "/dashboard/incidents", icon: ShieldAlert },
  { name: "Status Pages", to: "/dashboard/status-pages", icon: FileText },
  { name: "Integrations", to: "/dashboard/integrations", icon: Puzzle },
  { name: "Users", to: "/dashboard/users", icon: Users },
  { name: "Settings", to: "/dashboard/settings", icon: Settings },
];

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  loader: ({ context }) => {
    // @ts-ignore
    return context.queryClient.ensureQueryData({
      queryKey: ["userProfile"],
      queryFn: fetchUserProfile,
    });
  },
  
  pendingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  component: DashboardLayout,
});

function LoadingComponent() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0c0a09] text-white">
      <LoaderCircle className="h-8 w-8 animate-spin text-green-500" />
    </div>
  );
}

export function ErrorComponent({ error }: { error: Error }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#0c0a09] text-white">
      <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
      <pre className="text-white/70 bg-black/20 p-2 rounded-md">
        {error.message}
      </pre>
      <div className="flex  gap-3">
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="btn-primary"
      >
        Try Again
      </button>
      <button
        onClick={() => {
          useAuthStore.getState().logout()
          navigate({to:"/"})
        }}
        className="bg-red-500 p-3 rounded-lg"
      >
        Logout
      </button>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
  // Function to handle clicks outside the menu
  function handleClickOutside(event: MouseEvent) {
    if (
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target as Node) &&
      mobileProfileMenuRef.current && // Add this check
      !mobileProfileMenuRef.current.contains(event.target as Node) // And this one
    ) {
      setIsProfileMenuOpen(false);
    }
  }

  // Add event listener when the component mounts
  document.addEventListener("mousedown", handleClickOutside);

  // Clean up the event listener when the component unmounts
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [profileMenuRef, mobileProfileMenuRef]); // Add mobileProfileMenuRef to dependency array

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div
          className={`flex items-center gap-2 mb-8  ${isSidebarOpen ? "justify-start" : "justify-center"}`}
        >
          <img
            src={Icon}
            alt="UptimePulse Logo"
            className="h-10 w-10 flex-shrink-0"
          />
          <span
            className={`text-xl font-semibold transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 whitespace-nowrap hidden"}`}
          >
            UptimePulse
          </span>
        </div>

        <nav className="flex flex-col gap-2 ">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              activeOptions={{ exact: item.to === "/dashboard" }}
              className={`flex  items-center gap-3 p-2 rounded-md  text-white/70 hover:text-[#22c55e] transition-colors ${!isSidebarOpen && "justify-center "}`}
              activeProps={{ className: "!bg-[#262626] !text-[#22c55e]" }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={`transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 whitespace-nowrap hidden"}`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>
      <div
        ref={profileMenuRef}
        className="relative border-t border-white/10 pt-4 "
      >
        {isProfileMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 bg-[#1c1917] rounded-lg shadow-lg border border-white/10 z-50 ${isSidebarOpen ? "w-full" : "w-64 left-0"}`}
          >
            <div className="p-3 border-b border-white/10">
              <p className="text-xs text-white/50">Your Organizations</p>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span>Default</span>
                <Check className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="p-1">
              <Link
                to="/dashboard/settings"
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#292524]"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <User className="h-4 w-4" /> Account
              </Link>
              <a
                href="mailto:support@uptimepulse.com"
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#292524]"
              >
                <HelpCircle className="h-4 w-4" /> Get Help
              </a>
              <button
                onClick={() => {
                  logout();
                  toast.success("Logged out successfully!");
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#292524] w-full"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#292524] text-white/70 w-full transition-all duration-200 ${!isSidebarOpen && "justify-center"}`}
        >
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black flex-shrink-0">
            {userProfile?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          {isSidebarOpen && (
            <>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {userProfile?.name || "User"}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {userProfile?.email || "..."}
                </p>
              </div>
              <div className="flex-shrink-0">
                {isProfileMenuOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
  const SidebarContentMob = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div
          className={`flex items-center gap-2 mb-8  ${isSidebarOpen ? "justify-start" : "justify-center"}`}
        >
          <img
            src={Icon}
            alt="UptimePulse Logo"
            className="h-10 w-10 flex-shrink-0"
          />
          <span
            className={`text-xl font-semibold transition-opacity duration-200 `}
          >
            UptimePulse
          </span>
        </div>

        <nav className="flex flex-col gap-2 ">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              activeOptions={{ exact: item.to === "/dashboard" }}
              className={`flex  items-center gap-3 p-2 rounded-md hover:bg-[#292524] text-white/70 transition-colors `}
              activeProps={{ className: "!bg-[#22c55e] !text-white" }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={`transition-opacity duration-200 `}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
  return (
    <div className="flex h-screen bg-[#0c0a09] text-white font-sans">
      <aside
        className={`hidden md:flex flex-col bg-[#131211] p-4 border-r border-white/10 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-20"}`}
      >
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`md:hidden fixed top-0 left-0 h-full bg-[#131211] p-4 border-r border-white/10 z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} w-64`}
      >
        <SidebarContentMob />
      </aside>

      <div className="flex-1 flex flex-col w-full">
        <header className="flex justify-between items-center px-4 py-2 border-b border-white/10">
          <div className="flex items-center  gap-4 w-full justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
            
            <div
              ref={mobileProfileMenuRef}
              className="relativ md:hidden "
            >
              {isProfileMenuOpen && (
                <div
                  className={`absolute top-16 right-3 mb-2 bg-[#1c1917] rounded-lg shadow-lg border border-white/10 z-50 ${isSidebarOpen ? "w-full" : "w-64 "}`}
                >
                  <div className="p-3 border-b border-white/10">
                    <p className="text-xs text-white/50">Your Organizations</p>
                    <div className="flex justify-between items-center mt-1 text-sm">
                      <span>Default</span>
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#292524]"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" /> Account
                    </Link>
                    <a
                      href="mailto:support@uptimepulse.com"
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#292524]"
                    >
                      <HelpCircle className="h-4 w-4" /> Get Help
                    </a>
                    <button
                      onClick={() => {
                        logout();
                        toast.success("Logged out successfully!");
                        navigate({ to: "/" });
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[#292524] w-full"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#292524] text-white/70 w-full transition-all duration-200 ${!isSidebarOpen && "justify-center"}`}
              >
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black flex-shrink-0">
                  {userProfile?.name?.charAt(0).toUpperCase() || "U"}
                </div>

                {isSidebarOpen && (
                  <>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {userProfile?.name || "User"}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        {userProfile?.name || "..."}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isProfileMenuOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </>
                )}
              </button>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-1"
            >
              {isSidebarOpen ? <ChevronsLeft /> : <ChevronsRight />}
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#0c0a09]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
