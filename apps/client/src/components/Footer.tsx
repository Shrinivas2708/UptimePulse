import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
} from "lucide-react";
import Icon from "/logo.svg";
export const Footer = () => {
  return (
    <div className="z-20 md:px-10 ">
      <div className="bg-[#131211] p-5 space-y-3 rounded-t-xl">
        <div className="  flex justify-between flex-col md:flex-row items-center gap-3  ">
          <div className="flex  items-center gap-3 ">
            <img src={Icon} alt="" className="h-10 w-10 rounded-full" />
            <p className="text-2xl font-semibold">UptimePulse</p>
          </div>
          <div className="flex gap-3  ">
            <InstagramIcon
              size={25}
              className="hover:text-[#22C55E] cursor-pointer"
            />
            <LinkedinIcon
              size={25}
              className="hover:text-[#22C55E] cursor-pointer"
            />
            <TwitterIcon
              size={25}
              className="hover:text-[#22C55E] cursor-pointer"
            />
            <GithubIcon
              size={25}
              className="hover:text-[#22C55E] cursor-pointer"
            />
          </div>
        </div>
        <div className="text-center text-white/30">
          <p>© 2025 UptimePulse.com. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
