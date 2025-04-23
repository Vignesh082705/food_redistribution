import React, { useState, useEffect, useRef } from "react";
import faqData from './faq.json'; // Import the faq data from the JSON file

const Chatbot = () => {
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hi! How can I help you?" }]);
  const [input, setInput] = useState("");
  const [faq, setFaq] = useState(faqData); // Load the FAQ from the imported JSON

  const [isOpen, setIsOpen] = useState(false); // State to show/hide chatbot
  const chatRef = useRef(null);

  // Scroll to the latest message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);
  useEffect(() => {
    if (isOpen && chatRef.current) {
        setTimeout(() => {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 100); // Small delay to ensure UI updates before scrolling
    }
}, [isOpen]);
  // Handle user input and generate response
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };

    // Default bot response
    let botResponse = { sender: "bot", text: "Sorry, I didn't understand. Please Contact our Team via the contact page." };

    // Check if user input matches any stored question
    const findBestMatch = (userInput, faq) => {
      let bestMatch = null;
      let highestSimilarity = 0;

      faq.forEach((item) => {
        const similarity = calculateSimilarity(userInput.toLowerCase(), item.question.toLowerCase());
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = item;
        }
      });

      return bestMatch;
    };

    const calculateSimilarity = (str1, str2) => {
      let commonWords = 0;
      const words1 = str1.split(" ");
      const words2 = str2.split(" ");

      words1.forEach(word => {
        if (words2.includes(word)) {
          commonWords++;
        }
      });

      // Similarity is the ratio of common words to the total number of unique words
      return commonWords / Math.max(words1.length, words2.length);
    };

    // If no match is found, return the default response
    const bestMatch = findBestMatch(input, faq);
    if (bestMatch) {
      botResponse.text = bestMatch.answer;
    }

    // Add the user message and bot response to the chat history
    setMessages((prevMessages) => [...prevMessages, userMessage, botResponse]);
    setInput(""); // Clear input field after sending
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 md:right-6">
      {/* Toggle Chatbot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-500 w-12 h-12 text-white rounded-full shadow-xl flex items-center justify-center"
      >
        💬
      </button>

      {/* Chatbot UI (Show only when isOpen is true) */}
      {isOpen && (
        <div className="fixed bottom-19 border-1 right-4 md:right-6 w-full sm:w-80 md:w-96 bg-white shadow-lg rounded-lg p-4 transition-all duration-300 max-w-xs md:max-w-md">
          {/* Chat Header */}
          <div className="flex justify-between items-center pb-2 border-b">
            <h2 className="text-xl font-semibold ">Chatbot</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">
              ✖
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={chatRef} className="h-64 overflow-y-auto  scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}>
                <span className={`p-2 text-sm mt-5 rounded-lg max-w-[75%] ${msg.sender === "bot" ? "bg-gray-200 text-black" : "bg-blue-500 text-white"}`}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* Input & Send Button */}
          <div className="flex mt-2 w-full">
            {/* Input field */}
            <input
              type="text"
              className="w-full p-2 border rounded-l-lg text-sm placeholder-gray-400"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()} // Send on Enter key press
            />

            {/* Send Button */}
            <button
              className="bg-blue-500 text-white p-2 rounded-r-lg ml-2 hover:bg-blue-600 text-sm transition-all w-auto"
              onClick={handleSend}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;