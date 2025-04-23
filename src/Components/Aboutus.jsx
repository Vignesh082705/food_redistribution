import React from "react";
import { motion } from "framer-motion";
import AboutImage1 from "../assets/about1.jpg"; // Corrected import statement
import AboutImage2 from "../assets/about2.jpeg"; // Corrected import statement
import arcImage from "../assets/arc.png";

const InfoCard = ({ title, description }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
  >
    <h3 className="text-2xl font-bold text-green-700">{title}</h3>
    <p className="mt-2 text-gray-600 text-lg">{description}</p>
  </motion.div>
);

const AboutUs = () => {
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
          About Us
        </motion.h1>
        <img 
          src={arcImage} 
          alt="Decorative arc" // ✅ Added alt text for accessibility
          className="w-screen lg:bottom-40 md:bottom-20 bottom-8" 
        />
      </section>

      {/* Who We Are */}
      <section className="max-w-5xl md:mx-40 mx-15 flex flex-col md:flex-row items-center mb-16 mt-16 gap-4">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">Who We Are</h2>
          <p className="text-gray-700 leading-relaxed text-xl">
            At <strong>FoodRedistribution</strong>, we are dedicated to solving food wastage issues by creating a seamless platform that bridges donors and recipients.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center mt-6 md:mt-0">
          <img src={AboutImage1} alt="who we are" className="rounded-lg shadow-lg" />
        </div>
      </section>

      {/* Our Mission */}
      <section className="max-w-5xl mx-auto text-center mb-16">
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto text-xl">
          Reducing food waste and increasing accessibility through a technology-driven solution that benefits both donors and recipients.
        </p>
      </section>

      {/* What We Do */}
      <section className="max-w-5xl flex gap-10 flex-col md:flex-row items-center md:ml-40 mb-16">
        <div className="md:w-1/2 flex justify-center order-2 md:order-1 px-5">
          <img src={AboutImage2} alt="What we do" className="rounded-lg shadow-lg" />
        </div>
        <div className="md:w-1/2 order-1 md:order-2 ml-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">What We Do</h2>
          <ul className="list-disc list-inside text-xl text-gray-700 leading-relaxed">
            <li>Seamlessly connect donors and recipients.</li>
            <li>Provide real-time food availability updates.</li>
            <li>Ensure transparency and trust in food donations.</li>
          </ul>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-5xl mx-auto text-center mb-16">
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">Why Choose Us?</h2>
        <p className="text-gray-700 leading-relaxed text-xl max-w-3xl mx-auto">
          We streamline the donation process, reduce food wastage, and make a positive impact on the community and the environment.
        </p>
      </section>

      {/* Join Us Section */}
      <section className="text-center max-w-4xl mx-auto bg-gray-100 p-8 rounded-lg shadow-md mb-15">
        <h2 className="text-3xl font-semibold text-gray-900">Join Us in Making a Difference!</h2>
        <p className="text-gray-700 mt-4 text-xl leading-relaxed">
          Together, we can ensure that food reaches those who need it most. Whether you're a donor, recipient, or volunteer, your contribution matters!
        </p>
      </section>
      
    </div>
  );
};

export default AboutUs;