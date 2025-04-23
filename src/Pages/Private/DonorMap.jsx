import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const DonorMap = ({ donor }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyCZrcYTbWWbd-38bp8tytBdD_mLzgS8wzA", // 🔹 Replace with actual API key
  });

  if (!isLoaded) return <p>Loading Map...</p>;
  if (!donor || !donor.latitude || !donor.longitude) return <p>No Donor Location Found</p>; // 🔥 Check if donor has valid location

  const donorLocation = {
    lat: donor.latitude,
    lng: donor.longitude,
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-center mb-3">Donor Location</h3>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={donorLocation}
        zoom={13}
      >
        <Marker position={donorLocation} />
      </GoogleMap>
    </div>
  );
};

export default DonorMap;
