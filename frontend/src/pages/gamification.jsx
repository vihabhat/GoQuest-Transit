import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Image,
  Progress,
  Flex,
  useColorMode,
  useColorModeValue,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon, LockIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

const Gamification = () => {
  const [places, setPlaces] = useState([]);
  const [visitedCount, setVisitedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  const bgImage = "/assets/india-tourism-bg.png"; // background image path
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const progressColor = useColorModeValue("blue.500", "blue.300");

  // Fetch live location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchNearbyPlaces(latitude, longitude);
        },
        (err) => {
          console.error(err);
          setError("Location access denied. Please enable GPS.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported.");
      setLoading(false);
    }
  }, []);

  // Fetch nearby tourist places using Google Places API
  const fetchNearbyPlaces = async (lat, lng) => {
  try {
    setLoading(true);
    const radius = 10000; // 10 km
    const response = await fetch(
      `http://127.0.0.1:5000/api/nearby_places?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    const data = await response.json();

    if (data.results) {
      const formatted = data.results.slice(0, 9).map((place) => ({
        id: place.place_id,
        name: place.name,
        distance: Math.floor(Math.random() * 9 + 1) + " km",
        rating: place.rating || "N/A",
        image:
          place.photos && place.photos.length > 0
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${
                import.meta.env.VITE_GOOGLE_MAPS_API_KEY
              }`
            : "https://via.placeholder.com/400x250.png?text=No+Image",
      }));
      setPlaces(formatted);
    } else {
      setError("No nearby places found.");
    }
  } catch (err) {
    console.error(err);
    setError("Failed to fetch places from backend.");
  } finally {
    setLoading(false);
  }
};


  const handleVisit = (id) => {
    setVisitedCount((prev) => prev + 1);
    navigate("/lastmile");
  };

  const levelCompleted = visitedCount >= places.length;

  return (
    <Box
      minH="100vh"
      bgImage={`url(${bgImage})`}
      bgSize="cover"
      bgPos="center"
      px={8}
      py={6}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Flex align="center" gap={3}>
          <Image
            src="https://cdn-icons-png.flaticon.com/512/3011/3011270.png"
            boxSize="40px"
            alt="Logo"
          />
          <Heading fontSize="2xl" color={useColorModeValue("gray.800", "white")}>
            GoQuest Gamification
          </Heading>
        </Flex>
        <Button onClick={toggleColorMode} rounded="full" variant="ghost">
          {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </Flex>

      {/* Level Info */}
      <Box
        bg={useColorModeValue("whiteAlpha.800", "blackAlpha.600")}
        rounded="2xl"
        shadow="xl"
        p={6}
        mb={6}
      >
        <Heading size="md" mb={2}>
          Level 1 — Explore within 10 km radius
        </Heading>
        <Progress
          value={places.length ? (visitedCount / places.length) * 100 : 0}
          colorScheme="blue"
          size="sm"
          mb={2}
        />
        <Text fontSize="sm">
          {visitedCount} / {places.length} places visited
        </Text>
      </Box>

      {/* Places Section */}
      {loading ? (
        <Flex justify="center" align="center" mt={20}>
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Text color="red.400" fontWeight="medium" textAlign="center">
          {error}
        </Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={6}>
          {places.map((place) => (
            <Box
              key={place.id}
              bg={useColorModeValue("white", "gray.800")}
              shadow="lg"
              rounded="xl"
              overflow="hidden"
              _hover={{ transform: "scale(1.03)", transition: "0.3s" }}
            >
              <Image
                src={place.image}
                alt={place.name}
                h="180px"
                w="100%"
                objectFit="cover"
              />
              <Box p={4}>
                <Heading size="sm" mb={1}>
                  {place.name}
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {place.distance} away
                </Text>
                <Text fontSize="sm" color="yellow.500" mb={3}>
                  ⭐ {place.rating}
                </Text>
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={() => handleVisit(place.id)}
                >
                  Visit
                </Button>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Locked Level 2 */}
      <VStack
        mt={12}
        bg={useColorModeValue("whiteAlpha.800", "blackAlpha.700")}
        rounded="2xl"
        p={6}
        shadow="lg"
        opacity={levelCompleted ? 1 : 0.6}
        backdropFilter={levelCompleted ? "none" : "blur(4px)"}
        position="relative"
      >
        {!levelCompleted && (
          <Flex
            position="absolute"
            inset={0}
            bg="blackAlpha.500"
            rounded="2xl"
            align="center"
            justify="center"
          >
            <LockIcon boxSize={8} color="whiteAlpha.800" />
          </Flex>
        )}
        <Heading size="md">Level 2 — Advanced Explorer</Heading>
        <Text fontSize="sm" color="gray.500">
          Unlock after visiting all Level 1 places
        </Text>
      </VStack>
    </Box>
  );
};

export default Gamification;
