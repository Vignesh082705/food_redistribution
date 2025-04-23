import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import arcImage from "../../assets/arc.png"; // ✅ Fixed image import

// Reusable Card Component
const InfoCard = ({ title, description }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
  >
    <h3 className="text-2xl font-bold text-green-700">{title}</h3>
    <p className="mt-2 text-gray-600 text-lg">{description}</p>
  </motion.div>
);

const Donate = () => {
    const navigate = useNavigate();

    const handleSignup = () => {
      navigate("/signup?role=Donor"); // Donor role pass pannum
    };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-green-800 text-white py-24 pb-0 text-center flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold"
        >
          Donate
        </motion.h1>
        <img 
          src={arcImage} 
          alt="Decorative arc" // ✅ Added alt text for accessibility
          className="w-screen lg:bottom-40 md:bottom-20 bottom-8" 
        />
      </section>

      {/* Call to Action */}
      <section className="py-10 text-center px-6">
        <h1 className="text-5xl font-extrabold">Donate Surplus Food, Save Lives</h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto">
          Connect your extra food with those in need. Your generosity makes a difference.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <a href="/login" 
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-[#DE3163] rounded-full shadow-lg hover:bg-[#C51E50] transition">
            <span>🍽</span> Login
          </a>
          <button 
            onClick={handleSignup} // ✅ Now passing donor role
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-[#CCDF92] rounded-full shadow-lg hover:bg-[#A4B467] transition">
            <span>✋</span> Sign Up as Donor
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto text-center px-6 py-16">
        <h2 className="text-4xl font-bold text-gray-800">How It Works</h2>
        <p className="mt-4 text-lg text-gray-700">Donating is simple. Just follow these steps:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <InfoCard title="1. Register & List" description="Create an account and share details about your surplus food." />
          <InfoCard title="2. Find a Charity" description="Get matched with nearby charities needing food." />
          <InfoCard title="3. Schedule Pickup" description="A volunteer or charity representative picks up the food." />
        </div>
      </section>

      {/* Why Donate? */}
      <section className="bg-gray-100 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-800">Why Donate?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-6xl mx-auto px-6">
          <InfoCard title="Reduce Food Waste" description="Ensure your extra food feeds people, not landfills." />
          <InfoCard title="Make an Impact" description="Support communities and bring smiles through your donation." />
        </div>
      </section>
    </div>
  );
};

export default Donate;
