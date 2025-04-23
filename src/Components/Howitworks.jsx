import React from "react";
import { HiOutlineCheckCircle } from "react-icons/hi"; // Updated tick mark icon
import donation from "../assets/donation.jpg";
import charity from "../assets/charity.jpg";
import volunteer from "../assets/volunteer.jpg";

// Reusable Card Component
const Card = ({ title, image, alt, description, points }) => (
  <div className="w-full h-full flex group transition-all duration-500 ease-in-out">
    <div className="relative bg-white border border-gray-700 rounded-3xl shadow-md overflow-hidden hover:shadow-[0_8px_30px_rgba(222,49,99,0.3)] hover:scale-[1.03] transition duration-300">
      
      {/* Top Image */}
      <div className="overflow-hidden h-56">
        <img
          src={image}
          alt={alt}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 "
        />
      </div>

      {/* Content */}
      <div className="p-7">
        <h3 className="text-2xl font-bold text-pink-600 mb-3">{title}</h3>
        <p className="text-md text-gray-700 mb-2 font-semibold">{description}</p>
        <ul className="space-y-1 text-left">
  {points.map((point, index) => (
    <li
      key={index}
      className="flex items-start gap-3 text-md text-gray-800 leading-relaxed"
    >
      <HiOutlineCheckCircle className="text-[#DE3163] mt-1 min-w-[18px]" />
      <span className="text-left">{point}</span>
    </li>
  ))}
</ul>

      </div>
    </div>
  </div>
);

// Main How It Works Component
const Howitworks = () => {
  const cardData = [
    {
      title: "Donor",
      image: donation,
      alt: "Donor providing food",
      description: "Share your surplus food with those in need. Help reduce waste and make a difference in your community.",
      points: [
        "Easily share extra food with verified recipients and reduce community-level food waste.",
        "Stay updated on your donation’s journey from pickup to successful delivery."
      ]        
    },
    {
      title: "Recipient",
      image: charity,
      alt: "Recipient receiving food",
      description: "Request food from nearby donors or charities and get timely support when in need.",
      points: [
        "Quickly find and request available food donations near your location.",
        "Get timely assistance during emergencies or daily food needs."
      ]            
    },
    {
      title: "Volunteer",
      image: volunteer,
      alt: "Volunteer distributing food",
      description: "Assist in redistributing food and make a meaningful impact in your community by helping those in need.",
      points: [
        "Support the redistribution process by delivering food to those in need.",
        "Play a key role in building a compassionate and connected community."
      ]           
    }
  ];   

  return (
    <section id="how-it-works" className="py-12 px-4 sm:px-8 lg:px-10 bg-white">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardData.map((card, index) => (
            <Card
              key={index}
              title={card.title}
              image={card.image}
              alt={card.alt}
              description={card.description}
              points={card.points}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Howitworks;
