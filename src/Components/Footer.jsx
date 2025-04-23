import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { Link } from 'react-router-dom';
import footerImage from '../assets/logo.jpg'; // 🔁 Update path if needed

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-6 md:ml-16 sm:px-8">

        {/* Responsive Layout: Image + Content */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">

          {/* Left Side Image (Top on Mobile) */}
          <div className="flex justify-center sm:w-1/3">
            <img
              src={footerImage}
              alt="Footer Visual"
              className="w-60 h-auto rounded-xl"
            />
          </div>

          {/* Right Side Footer Content */}
          <div className="flex-1 md:ml-20 md:pt-6">

            {/* First Row: Links */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-6 md:ml-18 mb-8">
              <Link to="/about-us" className="text-white hover:text-[#DE3163]">About Us</Link>
              <Link to="/contact" className="text-white hover:text-[#DE3163]">Contact Us</Link>
              <Link to="/privacy-policy" className="text-white hover:text-[#DE3163]">Privacy Policy</Link>
            </div>

            {/* Second Row: Social Media Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:flex md:ml-19 md:justify-start">
              {/* Facebook */}
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <FontAwesomeIcon icon={faFacebook} size="2x" className="text-blue-600 hover:text-blue-400" />
                <span className="mt-2 text-sm">Facebook</span>
              </a>

              {/* Twitter */}
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <FontAwesomeIcon icon={faTwitter} size="2x" className="text-blue-500 hover:text-blue-300" />
                <span className="mt-2 text-sm">Twitter</span>
              </a>

              {/* Instagram */}
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <FontAwesomeIcon icon={faInstagram} size="2x" className="text-pink-400 hover:text-pink-500" />
                <span className="mt-2 text-sm">Instagram</span>
              </a>

              {/* Email */}
              <a href="mailto:vigneshvicky3663@gmail.com" className="flex flex-col items-center">
                <FontAwesomeIcon icon={faEnvelope} size="2x" className="text-red-500 hover:text-red-400" />
                <span className="mt-2 text-sm">Email</span>
              </a>
            </div>

            {/* Copyright */}
            <div className="text-center sm:text-left text-sm pt-7 md:pr-20">
              <p className="md:ml-13">&copy; 2024 Food Redistribution, Inc. All rights reserved.</p>
              <p className="mt-2 py-2 md:ml-2">Together, we fight food waste and ensure no one goes hungry.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
