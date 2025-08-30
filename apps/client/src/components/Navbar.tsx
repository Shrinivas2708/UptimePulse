import { Link, useNavigate } from "@tanstack/react-router";
import { Icon } from "../lib/exports";
import { useAuthStore } from "../store/useAuthStore";
import { Check,  HelpCircle, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchUserProfile } from "../api";
import { useQuery } from "@tanstack/react-query";

export const Navbar = () => {
  const { isAuthenticated,logout ,token} = useAuthStore();
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  // console.log(!token);
  
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    enabled:!!token,
    staleTime:5 * 60 * 1000,
  });
  useEffect(() => {
    // Function to handle clicks outside the menu
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    // Add event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);
  const navigate = useNavigate();
  return (
    <div className="z-30 h-16 absolute top-0 w-full border-b border-white/20 flex items-center px-2 md:px-10 justify-between ">
      <Link to="/" className="flex  items-center gap-2">
        <img src={Icon} alt="" className="h-10 w-10 rounded-full" />
        <p className="text-xl md:text-2xl font-semibold">UptimePulse</p>
      </Link>
      {isAuthenticated ? (
         <div
         ref={profileMenuRef}
         className="relative  "
       >
         {isProfileMenuOpen && (
           <div
             className={`absolute top-14 right-0 mb-2 bg-[#1c1917] rounded-lg shadow-lg border border-white/10 z-50   w-64 `}
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
                 href="mailto:support@UptimePulse.com"
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
           className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#292524] text-white/70 w-full transition-all duration-200 `}
         >
           <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black flex-shrink-0">
             {userProfile?.name?.charAt(0).toUpperCase() || "U"}
           </div>

          
         </button>
       </div>
      ) : (
        <div className="flex gap-2">
          <Link
            to="/login"
            className="bg-[#22c55e] md:py-2 px-2 md:px-4 text-sm rounded-md hover:bg-[#22c55e]/90 flex items-center "
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className=" border border-[#22c55e] py-2 px-2 md:px-4 text-sm rounded-md "
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
};
