import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Textarea,
  VStack,
  HStack,
  useColorMode,
  IconButton,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { FaArrowRight, FaRegCommentDots } from "react-icons/fa";
import axios from "axios";

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
      const res = await axios.post(
        "http://127.0.0.1:5000/api/ai_trip",
        { query: prompt },
        { headers: { "Content-Type": "application/json" } }
      );

      // Add AI response to chat
      setResponses((prev) => [
        ...prev,
        { text: res.data.response, id: prev.length },
      ]);

      setPrompt("");
    } catch (err) {
      console.error(err);
      setResponses((prev) => [
        ...prev,
        { text: "Error fetching AI response. Try again.", id: prev.length },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <Spinner size="xl" />;

  return (
    <Box
      minH="100vh"
      bgImage="url('https://images.unsplash.com/photo-1578325429217-54e48e96297f?auto=format&fit=crop&w=1470&q=80')"
      bgSize="cover"
      bgPosition="center"
      py={10}
    >
      <Container
        maxW="container.lg"
        bg={colorMode === "light" ? "whiteAlpha.900" : "blackAlpha.700"}
        borderRadius="lg"
        p={6}
        boxShadow="lg"
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg">Trip Planner AI</Heading>
          <HStack spacing={2}>
            <IconButton
              icon={<FaRegCommentDots />}
              aria-label="Chat"
              variant="outline"
            />
            <IconButton
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              aria-label="Toggle theme"
            />
          </HStack>
        </Flex>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || { lat: 13.0192, lng: 77.6426 }}
        zoom={14}
      >
        {/* Marker for user location */}
        {userLocation && <Marker position={userLocation} label="You" />}

        {/* AI Responses */}
        <VStack
          mt={8}
          spacing={4}
          align="stretch"
          maxH="60vh"
          overflowY="auto"
          p={4}
          borderRadius="md"
          bg={colorMode === "light" ? "gray.100" : "gray.600"}
        >
          {responses.length === 0 && !loading && (
            <Text color="gray.500">
              Your AI-generated travel plan will appear here.
            </Text>
          )}
          {responses.map((resp) => (
            <Box
              key={resp.id}
              p={4}
              borderRadius="md"
              bg={colorMode === "light" ? "white" : "gray.700"}
              shadow="md"
              overflowWrap="break-word"
              whiteSpace="pre-wrap"
            >
              <Text>{resp.text}</Text>
            </Box>
          ))}
          {loading && (
            <Flex justify="center" py={4}>
              <Spinner size="lg" />
            </Flex>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
