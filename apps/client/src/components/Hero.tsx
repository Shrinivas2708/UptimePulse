import { Link } from "@tanstack/react-router"
import { useAuthStore } from "../store/useAuthStore"
import HeroImg from "/Hero.png"
function Hero() {

  return <section className="relative pt-14 flex flex-col justify-center items-center gap-5 ">
  <div className="text-2xl sm:text-4xl md:text-5xl  font-semibold px-1 text-center mt-10 md:mt-0">
    <p>Downtime is an Expensive Lesson</p>
    <p>
      <span className="text-[#22c55e]">Uptime</span> is a Smart Investment
    </p>
  </div>

  <div className="text-center max-w-xl text-white/50 text-sm md:text-base">
    <p>
      Go beyond basic pings. UptimePulse is your 24/7 watchtower, catching
      performance issues and potential downtime before they impact your
      customers and your bottom line.
    </p>
  </div>

  <div className="space-y-1 flex flex-col">
    <Link to="/dashboard" className="bg-[#22c55e] py-2 md:py-3 px-2 md:px-5 rounded-md hover:bg-[#22c55e]/90 md:text-base text-sm">
     {useAuthStore.getState().isAuthenticated ? "Go to Dashboard" : " Start for Free"}
    </Link>
    <p className="text-[0.7rem] text-gray-400 text-center">
      No credit card required
    </p>
  </div>
  <div className=" max-w-6xl mt-5">
    <img
      src={HeroImg}
      alt=""
      className="rounded-lg"
    />
  </div>
</section>
}

export default Hero