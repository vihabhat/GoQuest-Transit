import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  VStack,
  HStack,
  useColorMode,
  IconButton,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { FaArrowRight, FaRegCommentDots } from "react-icons/fa";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

export default function TripPlanner() {
  const [userLocation, setUserLocation] = useState(null);
  const [prompt, setPrompt] = useState(""); // ✅ Added
  const [responses, setResponses] = useState([]); // ✅ Added
  const [loading, setLoading] = useState(false);

  const { colorMode, toggleColorMode } = useColorMode(); // ✅ Added

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // ✅ Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          // Default to Bangalore
          setUserLocation({ lat: 13.0192, lng: 77.6426 });
        }
      );
    }
  }, []);

  // ✅ AI Trip Planner call
  const handlePlanTrip = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/api/ai_trip",
        { query: prompt },
        { headers: { "Content-Type": "application/json" } }
      );

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

        {/* Input for AI Query */}
        <Flex mb={4}>
          <Textarea
            placeholder="Describe your trip plan (e.g., weekend getaway in Bangalore)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            bg={colorMode === "light" ? "white" : "gray.700"}
            mr={2}
          />
          <IconButton
            icon={<FaArrowRight />}
            colorScheme="teal"
            onClick={handlePlanTrip}
            isLoading={loading}
            aria-label="Generate trip plan"
          />
        </Flex>

        {/* Map Display */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation || { lat: 13.0192, lng: 77.6426 }}
          zoom={14}
        >
          {userLocation && <Marker position={userLocation} label="You" />}
        </GoogleMap>

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
