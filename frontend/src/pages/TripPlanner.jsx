import React, { useState, useEffect } from "react";
import { Box, Button, Spinner } from "@chakra-ui/react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

export default function TripPlanner() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          // Fallback location (e.g., Bangalore)
          setUserLocation({ lat: 13.0192, lng: 77.6426 });
        }
      );
    }
  }, []);

  const fetchNearbyPlaces = async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/nearby_places?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10000`
      );
      const data = await res.json();
      setPlaces(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <Spinner size="xl" />;

  return (
    <Box p={4}>
      <Button
        colorScheme="blue"
        mb={4}
        onClick={fetchNearbyPlaces}
        isLoading={loading}
      >
        Fetch Nearby Places
      </Button>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || { lat: 13.0192, lng: 77.6426 }}
        zoom={14}
      >
        {/* Marker for user location */}
        {userLocation && <Marker position={userLocation} label="You" />}

        {/* Markers for nearby places */}
        {places.map((place) => (
          <Marker
            key={place.place_id}
            position={{
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            }}
            title={place.name}
          />
        ))}
      </GoogleMap>
    </Box>
  );
}
