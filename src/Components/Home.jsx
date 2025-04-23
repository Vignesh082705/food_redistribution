import React from "react";
import Hero from "./Hero";
import Howitworks from "./Howitworks";
import Solve from "./Solve";
import Feedback from "./Feedback";
import Chatbot from "./Chatbot"; // Chatbot should be at the bottom

const Home = () => {
  return (
    <main className="flex flex-col">
      <Hero />
      <Howitworks />
      <Solve />
      <Feedback />
      <Chatbot /> {/* Chatbot should be rendered last */}
    </main>
  );
};

export default Home;
