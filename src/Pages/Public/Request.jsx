import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

const Request = () => {
    const navigate = useNavigate();

    const handleSignup = () => {
      navigate("/signup?role=Recipient"); // Donor role pass pannum
    };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className=" bg-green-800 text-white py-24 pb-0 text-center flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold"
        >
          Recipient
        </motion.h1>
          <img src="/src/assets/arc.png" className="w-screen lg:bottom-40 md:bottom-20 bottom-8"></img>
      </section>
      <section className="py-10 text-center px-6">
        <h1 className="text-5xl font-extrabold">Request Food Assistance for Charity</h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto">
        If your charity needs food donations, we’re here to help! Request food and feed those in need.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <a href="/login" 
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-[#DE3163] rounded-full shadow-lg hover:bg-[#E195AB] transition">
            <span>🍽</span> Login
          </a>
          <button 
            onClick={handleSignup} // ✅ Now passing donor role
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-[#CCDF92] rounded-full shadow-lg hover:bg-[#A4B467] transition">
            <span>✋</span> Sign Up as Recipient
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto text-center px-6">
        <h2 className="text-4xl font-bold text-gray-800">How It Works</h2>
        <p className="mt-4 text-lg text-gray-700">Requesting food donations for your charity is simple. Here’s how:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <InfoCard title="1. Sign Up & Submit Request" description="Register your charity and submit a food request." />
          <InfoCard title="2. Get Matched with Donors" description="We connect you with donors who are ready to contribute." />
          <InfoCard title="3. Receive & Distribute Food" description="The donated food will be delivered to your charity for distribution." />
        </div>
      </section>

      {/* Why Request Food for Charity? */}
      <section className="bg-gray-100 py-16 mt-16 text-center">
        <h2 className="text-4xl font-bold text-gray-800">Why Request Food for Charity?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-5xl mx-auto px-6">
          <InfoCard title="Fight Hunger in Your Community" description="Help feed individuals and families struggling with food insecurity." />
          <InfoCard title="Make a Positive Impact" description="By requesting food donations, you bring hope to those in need." />
        </div>
      </section>
    </div>
  );
};

export default Request;
