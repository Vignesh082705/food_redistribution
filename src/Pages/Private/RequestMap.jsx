import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const RequestMap = ({ request }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyCZrcYTbWWbd-38bp8tytBdD_mLzgS8wzA",
  });

  if (!isLoaded) return <p>Loading Map...</p>;
  if (!request || !request.latitude || !request.longitude)
    return <p>No Recipient Location Found</p>;

  const requestLocation = {
    lat: Number(request.latitude),
    lng: Number(request.longitude),
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-center mb-3">Request Location</h3>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={requestLocation}
        zoom={13}
      >
        <Marker position={requestLocation} />
      </GoogleMap>
    </div>
  );
};

export default RequestMap;
