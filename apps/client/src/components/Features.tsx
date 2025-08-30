// import React from "react";
import FeatureCarousel from "./FeatureCarousel";

function FeaturesSection() {
  return (
    <section className="flex flex-col justify-center items-center pt-24 gap-5">
      <div className="inline-block px-4 py-1.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-sm font-medium  ">
        <span>Features</span>
      </div>
      <div className="text-3xl md:text-4xl text-center font-semibold ">
        <p>
          What{" "}
          <span className="text-[#22c55e] bg-[#22c55e]/10 px-2">
            UptimePulse
          </span>{" "}
          offers?{" "}
        </p>
      </div>
      <div className="max-w-xl md:max-w-md text-white/60 text-center text-sm md:text-base ">
        <p>
          UptimePulse offers comprehensive website monitoring, combining
          real-time alerts with powerful analytics to keep your online presence
          running smoothly
        </p>
      </div>
      <FeatureCarousel/>
    </section>
  );
}

export default FeaturesSection;
