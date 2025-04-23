import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Components/Header";
import Home from "./Components/Home";
import Footer from "./Components/Footer";
import Donate from "./Pages/Public/Donate";
import Request from "./Pages/Public/Request";
import Volunteer from "./Pages/Public/Volunteer";
import Contact from "./Pages/Public/Contact";
import SignUp from "./Pages/Public/Signup";
import Login from "./Pages/Public/Login";
import Profile from "./Pages/Private/Profile";
import ForgotPass from "./Components/ForgotPass";
import DonateFood from "./Pages/Private/DonateFood";
import RequestFood from "./Pages/Private/RequestFood";
import MyRequests from "./Pages/Private/MyRequests";
import Donationhistory from "./Pages/Private/Donationhistory";
import ScrollToTop from "./Pages/Public/ScrollToTop";
import FindFood from "./Pages/Private/FindFood";
import Requests from "./Pages/Private/Requests";
import PrivacyPolicy from "./Components/Privacypolicy";
import AboutUs from "./Components/Aboutus";
import RecipientNotification from "./Pages/Private/RecipientNotification";
import DonorNotification from "./Pages/Private/DonorNotification";
import VolunteerNotification from "./Pages/Private/VolunteerNotification";
import Task from "./Pages/Private/Task";
import FoodAvailable from "./Pages/Private/FoodAvailable";
import Map from "./Pages/Private/Map";
import DefaultMap from "./Pages/Private/DefaultMap";

function App() {
  return (
    <Router> {/* Wrap everything inside Router */}
    <ScrollToTop />
      {/* Global Scrollbar Component */}
      <Header />
      <main >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/request" element={<Request />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/forgot-password" element={<ForgotPass/>}/>
          <Route path="/add-donation" element={<DonateFood/>}/>
          <Route path="/my-donations" element={<Donationhistory />}/>
          <Route path="/request-food" element={<RequestFood />}/>
          <Route path="/my-requests" element={<MyRequests />}/>
          <Route path="/find-food" element={<FindFood />}/>
          <Route path="/requests" element={<Requests />}/>
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/notifications-recipient" element={<RecipientNotification />} />
          <Route path="/notifications-volunteer" element={<VolunteerNotification />} />
          <Route path="/notifications-donor" element={<DonorNotification />} />
          <Route path="/tasks" element={<Task />} />
          <Route path="/food-available" element={<FoodAvailable/>}/>
          <Route path="/map/:taskId" element={<Map />} />
          <Route path="/map" element={<DefaultMap />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
