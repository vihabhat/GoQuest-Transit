import React from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const MapRoute = ({ start, end, waypoints }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) return <div>Loading Map...</div>;

  // Validate coordinates
  if (
    !start || !end ||
    typeof start.lat !== "number" || typeof start.lng !== "number" ||
    typeof end.lat !== "number" || typeof end.lng !== "number"
  ) {
    return <div>Invalid coordinates for map</div>;
  }

  const validWaypoints = (waypoints || []).filter(
    w => w?.position?.lat && w?.position?.lng
  );

  const markers = [
    { position: start, label: "Start" },
    ...validWaypoints,
    { position: end, label: "End" }
  ];

  const path = [start, ...validWaypoints.map(w => w.position), end];

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={start} zoom={14}>
      {markers.map((m, idx) => (
        <Marker key={idx} position={m.position} label={m.label} />
      ))}
      <Polyline path={path} options={{ strokeColor: "#3182CE", strokeWeight: 4 }} />
    </GoogleMap>
  );
};

export default MapRoute;
