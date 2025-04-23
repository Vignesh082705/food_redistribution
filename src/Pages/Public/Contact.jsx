import React, { useState } from "react";
import emailjs from "@emailjs/browser";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending your message...");

    emailjs
      .send(
        "Project", // Replace with your EmailJS Service ID
        "template_irxx58o", // Replace with your EmailJS Template ID
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        "aA2kpBr64MW2_su36" // Replace with your EmailJS Public Key
      )
      .then(() => {
        setStatus("Message sent successfully! Thank you for reaching out.");
        setFormData({ name: "", email: "", message: "" });
      })
      .catch(() => {
        setStatus("Oops! Something went wrong. Please try again.");
      });
  };

  return (
    <section className="bg-indigo-50 py-16" id="contact">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-3xl font-bold uppercase tracking-wide text-indigo-600">
            Get In Touch
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl text-gray-800 font-bold mb-4">
            We Would Love to Hear From You
          </h2>
          <p className="text-xl text-gray-700">
            Whether you have a question or want to get involved, feel free to reach out to us!
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col justify-center">
  <p className="text-lg text-gray-700 px-5 mb-8">
    Your voice can spark change. Whether you're here to donate, ask for help, or collaborate, we’re ready to make a difference together. Contact us, and let's work towards a brighter future.
  </p>
  <p className="text-lg text-gray-700 px-5 mb-4">
    Have feedback or want to collaborate with us? Drop a message, or reach us directly at:
  </p>
  <p className="text-lg text-gray-700 px-5 flex items-center mb-4">
    <i className="fas fa-envelope mr-2 text-indigo-600"></i>
    <strong>Email:</strong> <a href="mailto:vigneshvicky3663@gmail.com" className="text-indigo-600 hover:underline"> vigneshvicky3663@gmail.com</a>
  </p>
  <p className="text-lg text-gray-700 px-5 flex items-center">
    <i className="fas fa-phone-alt mr-2 text-indigo-600"></i>
    <strong>Phone:</strong> <a href="tel:+91 6374193085" className="text-indigo-600 hover:underline"> +91 6374193085</a>
  </p>
</div>
            <div className="card max-w-lg mx-auto p-8 bg-white shadow-xl rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Let's Connect</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Full Name"
                  className="w-full p-3 mb-4 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email Address"
                  className="w-full p-3 mb-4 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <textarea
                  name="message"
                  placeholder="Your Message"
                  cols="30"
                  rows="5"
                  className="w-full p-3 mb-4 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  Send Message
                </button>
                {status && (
                  <p
                    className={`mt-4 text-center ${
                      status.includes("success") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {status}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;