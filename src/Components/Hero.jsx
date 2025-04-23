import React from "react";
import videoSrc from "../assets/hero.jpg"; // Corrected video import
import arcImg from "../assets/arc.png"; // Corrected image import

const Hero = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center px-6 pb-22 md:pb-20  overflow-hidden">
    {/* Arc Image at Bottom */}
    <img 
      src={arcImg} 
      alt="Arc Bottom" 
      className="absolute bottom-0 left-0 w-full object-contain -z-10 pointer-events-none "
    />
  
    {/* Content Wrapper */}
    <div className="relative  flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mx-auto">
      
      {/* Left Side - Image */}
      <div className="w-full md:w-1/2 flex justify-center mb-7">
        <img 
          src={videoSrc} 
          alt="Hero Visual"
          className="w-full max-w-md object-contain -z-20"
        />
      </div>
  
      {/* Right Side - Text + Buttons */}
      <div className="w-full md:w-1/2 text-center md:text-left">
      <h1 className="text-4xl md:text-5xl font-bold uppercase ">
  <span className=" block text-center  text-[#DE3163]">Donate Food,Fight Hunger</span>
</h1>
        <p className="text-lg md:text-xl mt-4 text-amber-500 font-semibold">
          Join us in reducing food waste and feeding those in need.
        </p>
  
        {/* Donate Now Button - Normal */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center md:ml-20 md:justify-start">
  <div className="animated-gradient-border">
    <a href="/signup" className="animated-gradient-button delay">
      🍽 Donate Now
    </a>
  </div>

  {/* Request Food Button - Delayed */}
  <div className="animated-gradient-border">
    <a href="/signup" className="animated-gradient-button delay">
      ✋ Request Food
    </a>
  </div>
      </div>
      </div>
    </div>
  </section>
  );
};

export default Hero;