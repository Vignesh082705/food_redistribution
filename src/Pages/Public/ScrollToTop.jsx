import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const {pathname}=useLocation();

  // Show button when the user scrolls down
  useEffect(() => {
    window.scrollTo(0,0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;