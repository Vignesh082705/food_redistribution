import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import arcImage from "../../assets/arc.png";

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
// Reusable Card Component for Task/Opportunity

const Volunteer = () => {
    const navigate = useNavigate();

    const handleSignup = () => {
      navigate("/signup?role=Volunteer"); // Donor role pass pannum
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
          Volunteer
        </motion.h1>
          <img 
                    src={arcImage} 
                    alt="Decorative arc" // ✅ Added alt text for accessibility
                    className="w-screen lg:bottom-40 md:bottom-20 bottom-8" 
                  />
      </section>
      <section className="py-10 text-center px-6">
        <h1 className="text-5xl font-extrabold">Become a Volunteer, Make a Difference</h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto">
        Join our efforts to help those in need. Volunteer for food redistribution and bring hope to communities.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <a href="/login" 
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-[#DE3163] rounded-full shadow-lg hover:bg-[#E195AB] transition">
            <span>🍽</span> Login
          </a>
          <button 
            onClick={handleSignup} // ✅ Now passing donor role
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-[#CCDF92] rounded-full shadow-lg hover:bg-[#A4B467] transition">
            <span>✋</span> Sign Up as Volunteer
          </button>
        </div>
      </section>
      <section className="max-w-5xl mx-auto text-center px-6">
        <h2 className="text-4xl font-bold text-gray-800">How It Works</h2>
        <p className="mt-4 text-lg text-gray-700">Requesting food donations for your charity is simple. Here’s how:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <InfoCard title="1. Register and Explore Tasks" description=" Sign up and see delivery tasks assigned by donors near you."/>
          <InfoCard title="2.Accept, Deliver & Confirm" description="Pick up food from donors, deliver it, and update the status." />
          <InfoCard title="3.Claim Unaccepted Donations" description="Take over donations not claimed by recipients within 30 minutes." />
        </div>
      </section>

     
      {/* Why Volunteer? */}
      <section className="bg-gray-100 py-16 mt-16 text-center">
        <h2 className="text-4xl font-bold text-gray-800">Why Volunteer with Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-5xl mx-auto px-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-600">Make a Positive Impact</h3>
            <p className="mt-2 text-gray-600">
              Your help can feed families and individuals in need, making a real difference in their lives.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-600">Meet Like-Minded People</h3>
            <p className="mt-2 text-gray-600">
              Join a community of passionate volunteers dedicated to helping others.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Volunteer;
