import React from 'react';
import food from "../assets/food.jpg";
import request from "../assets/request.jpg";
import volunteer2 from "../assets/volunteer2.jpg";

const Solve = () => {
  const cardData = [
    {
      image: food,
      borderColor: 'border-pink-300',
      hoverTextColor: 'text-pink-500',
      title: 'Effectively Reducing Surplus Food Waste Globally',
      points: [
        'Connects food donors with recipients to prevent excess food from being discarded.',
        'Automated notifications ensure quick redistribution, minimizing wastage.',
      ],
    },
    {
      image: request,
      borderColor: 'border-orange-300',
      hoverTextColor: 'text-yellow-500',
      title: 'Provides Timely Access to Food for the Needy',
      points: [
        'Enables real-time food requests, helping recipients find nearby food sources.',
        'Location-based donations ensure quick delivery and food freshness.',
      ],
    },
    {
      image: volunteer2,
      borderColor: 'border-blue-300',
      hoverTextColor: 'text-blue-500',
      title: 'Encourages a Sustainable and Charitable Society',
      points: [
        'Simplifies the donation process, making it easy for donors to contribute.',
        'Promotes social responsibility and community engagement in food redistribution.',
      ],
    },
  ];

  const SolveCard = ({ image, borderColor, hoverTextColor, title, points }) => (
    <div
      className={`group w-full max-w-md mx-auto p-6 bg-white border-2 ${borderColor} rounded-xl shadow-lg transition-all duration-500 ease-in-out hover:shadow-2xl hover:scale-105`}
    >
      <img src={image} alt={title} className="w-full h-40 object-cover rounded-md mb-4" />
      <div className="p-2">
        <h3 className={`text-lg font-semibold text-gray-800 group-hover:${hoverTextColor} transition-colors`}>
          {title}
        </h3>
        <div className="text-gray-600 mt-2">
          <ul >
            {points.map((point, index) => (
              <li key={index}>🔹 {point}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-12">
      <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
        A Solvable Problem
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardData.map((card, index) => (
          <SolveCard
            key={index}
            image={card.image}
            borderColor={card.borderColor}
            hoverTextColor={card.hoverTextColor}
            title={card.title}
            points={card.points}
          />
        ))}
      </div>
    </div>
  );
};

export default Solve;
