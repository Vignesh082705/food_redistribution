import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Reusable Card Component for Task/Opportunity
const TaskCard = ({ title, description, location }) => (
  <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <h3 className="text-xl font-semibold text-green-600">{title}</h3>
    <p className="mt-2 text-gray-600">{description}</p>
    <p className="mt-2 text-gray-500">Location: {location}</p>
    <a
      href="#"
      className="mt-4 inline-block text-white bg-green-600 font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-all"
    >
      Accept Task
    </a>
  </div>
);

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
          <img src="/src/assets/arc.png" className="w-screen lg:bottom-40 md:bottom-20 bottom-8"></img>
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

      {/* Volunteer Tasks/Opportunities */}
      <section className="max-w-5xl mx-auto text-center px-6 py-16">
        <h2 className="text-4xl font-bold text-gray-800">Volunteer Opportunities</h2>
        <p className="mt-4 text-lg text-gray-700">Select tasks and contribute to making a difference:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <TaskCard
            title="Food Pickup for Local Charity"
            description="Help collect food from donors and deliver it to local charities."
            location="Downtown, City Name"
          />
          <TaskCard
            title="Meal Distribution at Homeless Shelter"
            description="Assist in distributing meals to those in need at the shelter."
            location="Shelter Location, City Name"
          />
          <TaskCard
            title="Food Sorting and Packaging"
            description="Sort and package donated food for distribution."
            location="Warehouse Location, City Name"
          />
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
