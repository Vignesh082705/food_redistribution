import React, { useState } from "react";

const sections = [
    { 
        title: "Information We Collect", 
        content: (
            <>
                <strong>For Donors:</strong><br />
                <ul className="list-disc pl-6">
                    <li><strong>Personal Information:</strong> Name, email, phone number, and address.</li>
                    <li><strong>Food Donation Details:</strong> Type of food, date, time, and pickup location.</li>
                    <li><strong>Verification Information:</strong> To prevent fraud and ensure safe donations.</li>
                </ul>
                <br />
                <strong>For Recipients (Charities):</strong><br />
                <ul className="list-disc pl-6">
                    <li><strong>Charity Details:</strong> Organization name, registration number, and contact information.</li>
                    <li><strong>Food Request Details:</strong> Type of food needed, quantity, and preferred pickup location.</li>
                    <li><strong>Verification Information:</strong> To confirm eligibility and prevent misuse.</li>
                </ul>
                <br />
                <strong>For Volunteers:</strong><br />
                <ul className="list-disc pl-6">
                    <li><strong>Personal Information:</strong> Name, email, and phone number.</li>
                    <li><strong>Availability & Preferences:</strong> To coordinate donation pickup and delivery.</li>
                    <li><strong>Verification Information:</strong> To maintain security and prevent unauthorized activities.</li>
                </ul>
            </>
        )
    },
    { 
        title: "How We Use Your Information", 
        content: (
            <ul className="list-disc pl-6">
                <li>To connect donors with recipients (charities) and volunteers for efficient food distribution.</li>
                <li>To store donation and request history for tracking and transparency.</li>
                <li>To send notifications regarding food donation requests, approvals, or updates.</li>
                <li>To verify the authenticity of donors, recipients, and volunteers.</li>
                <li>To improve our platform by analyzing user activity and feedback.</li>
            </ul>
        )
    },
    { 
        title: "Responsibility for Food Safety & Quality", 
        content: (
            <>
                <strong>For Donors:</strong>
                <ul className="list-disc pl-6">
                    <li>Full responsibility for food quality and safety lies with the donor.</li>
                    <li>FoodRedistribution does not inspect, verify, or alter the condition of donated food.</li>
                    <li>Once donated, the recipient (charity) must verify and accept the food at their own discretion.</li>
                </ul>
                <br />
                <strong>For Recipients (Charities):</strong>
                <ul className="list-disc pl-6">
                    <li>Recipients must inspect the food before accepting it.</li>
                    <li>FoodRedistribution does not guarantee the safety, quality, or suitability of the food.</li>
                    <li>Recipients agree to use the donated food at their own risk.</li>
                </ul>
            </>
        )
    },
    { 
        title: "Data Security", 
        content: "We use industry-standard security measures to protect your personal information. However, no online platform can be 100% secure. You are responsible for keeping your login credentials safe." 
    },
    { 
        title: "Data Sharing & Third Parties", 
        content: (
            <>
                We do not sell or trade your personal data. However, we may share your information:
                <ul className="list-disc pl-6">
                    <li>With registered users (Donors, Recipients, or Volunteers) as needed for food donation coordination.</li>
                    <li>With legal authorities if required by law.</li>
                    <li>With service providers for platform maintenance and improvement.</li>
                </ul>
            </>
        )
    },
    { 
        title: "Your Rights", 
        content: (
            <ul className="list-disc pl-6">
                <li><strong>Access & Update:</strong> You can view and update your personal information in your profile settings.</li>
                <li><strong>Account Deletion:</strong> You can request to delete your account and data permanently.</li>
            </ul>
        )
    },
    { 
        title: "Changes to This Policy", 
        content: "We may update this Privacy Policy from time to time. Any changes will be notified through the platform or via email." 
    },
    { 
        title: "Contact Us", 
        content: (
            <>
                📩 <strong>Email:</strong> projecthelp@gmail.com<br />
                📍 <strong>Address:</strong> Kumbakonam
            </>
        ) 
    }
];

const PrivacyPolicy = () => {
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (index) => {
        setOpenSection(openSection === index ? null : index);
    };

    return (
        <div className="max-w-5xl mx-auto p-8 bg-white shadow-lg rounded-lg">
            <h1 className="text-5xl font-extrabold text-center text-gray-900 mb-6">Privacy Policy</h1>
            <p className="text-lg text-gray-600 text-center mb-8">
                Last Updated: <span className="font-semibold">13 MARCH 2025</span>
            </p>

            {sections.map((section, index) => (
                <div key={index} className="mb-6 border-b pb-4">
                    <button 
                        className="w-full flex justify-between items-center text-left"
                        onClick={() => toggleSection(index)}
                        aria-expanded={openSection === index}
                    >
                        <h2 className="text-2xl font-bold text-gray-800">{index + 1}. {section.title}</h2>
                        <span className="text-2xl font-bold">
                            {openSection === index ? "▲" : "▼"}
                        </span>
                    </button>
                    {openSection === index && (
                        <div className="text-gray-700 leading-relaxed mt-3">
                            {section.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PrivacyPolicy;
