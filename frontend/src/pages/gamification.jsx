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
  HStack,
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

  const bgImage = "/assets/india-tourism-bg.png";
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const progressColor = useColorModeValue("blue.500", "blue.300");

  // Fetch live location
  useEffect(() => {
    console.log("Gamification component mounted");
    console.log("API Key available:", !!apiKey);

    if (navigator.geolocation) {
      console.log("Requesting geolocation...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log("Location obtained:", { latitude, longitude });
          fetchNearbyPlaces(latitude, longitude);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError(`Location access denied: ${err.message}. Please enable GPS.`);
          setLoading(false);
        }
      );
    } else {
      console.error("Geolocation not supported");
      setError("Geolocation not supported by your browser.");
      setLoading(false);
    }
  }, []);

  // Fetch nearby tourist places using Google Places API
  const fetchNearbyPlaces = async (lat, lng) => {
    try {
      setLoading(true);
      setError(null);
      const radius = 10000; // 10 km
      const url = `http://127.0.0.1:5000/api/nearby_places?lat=${lat}&lng=${lng}&radius=${radius}`;

      console.log('=== Fetching Places ===');
      console.log('URL:', url);
      console.log('Coordinates:', { lat, lng });
      console.log('Radius:', radius);

      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('=== Received Data ===');
      console.log('Full response:', data);
      console.log('Results count:', data.results?.length || 0);

      if (data.error) {
        console.error('API returned error:', data.error);
        setError(data.error);
        return;
      }

      if (data.results && data.results.length > 0) {
        console.log('Processing places...');
        const formatted = data.results.slice(0, 9).map((place, index) => {
          console.log(`Place ${index + 1}:`, {
            name: place.name,
            id: place.place_id,
            hasPhotos: !!place.photos,
            rating: place.rating
          });

          // Handle new Places API photo format
          let imageUrl = "https://via.placeholder.com/400x250.png?text=No+Image";
          if (place.photos && place.photos.length > 0) {
            const photoReference = place.photos[0].photo_reference;
            // New API uses resource name format: places/{place_id}/photos/{photo_id}
            if (photoReference.startsWith('places/')) {
              imageUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}`;
            } else {
              // Fallback to old API format
              imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
            }
          }

          return {
            id: place.place_id,
            name: place.name,
            distance: Math.floor(Math.random() * 9 + 1) + " km",
            rating: place.rating || "N/A",
            image: imageUrl,
          };
        });

        console.log('=== Formatted Places ===');
        console.log('Total formatted:', formatted.length);
        console.log('Places:', formatted);
        setPlaces(formatted);
      } else {
        console.warn('No results in response');
        setError("No nearby tourist attractions found in this area. Try a different location.");
      }
    } catch (err) {
      console.error('=== Fetch Error ===');
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);

      if (err.message.includes('Failed to fetch')) {
        setError("Cannot connect to backend. Make sure the server is running on port 5000.");
      } else {
        setError(`Failed to fetch places: ${err.message}`);
      }
    } finally {
      setLoading(false);
      console.log('=== Fetch Complete ===');
    }
  };

  const handleVisit = (id) => {
    console.log('Visiting place:', id);
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
      <Flex
        justify="space-between"
        align="center"
        px={8}
        py={4}
        bg="whiteAlpha.900"
        boxShadow="md"
        position="relative"
        zIndex={1}
      >
        <Heading color="teal.500" size="lg" cursor="pointer" onClick={() => navigate("/")}>
          GoQuest Transit
        </Heading>
        <HStack spacing={4}>
          <Button colorScheme="teal" onClick={() => navigate("/gamification")}>
            Explore Nearby
          </Button>

          <Button variant="ghost" onClick={() => navigate("/tripplanner")}>
            AI Trip Planner
          </Button>
          <Button variant="ghost" onClick={() => navigate("/profile")}>
            Profile
          </Button>
        </HStack>
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
        <Flex justify="center" align="center" mt={20} direction="column" gap={4}>
          <Spinner size="xl" color={progressColor} thickness="4px" />
          <Text color={useColorModeValue("gray.600", "gray.300")}>
            Loading nearby places...
          </Text>
        </Flex>
      ) : error ? (
        <Box
          bg={useColorModeValue("red.50", "red.900")}
          color={useColorModeValue("red.800", "red.200")}
          p={6}
          rounded="xl"
          textAlign="center"
        >
          <Text fontWeight="medium" fontSize="lg" mb={2}>
            ⚠️ Error Loading Places
          </Text>
          <Text>{error}</Text>
          <Button
            mt={4}
            colorScheme="red"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      ) : places.length === 0 ? (
        <Box
          bg={useColorModeValue("yellow.50", "yellow.900")}
          color={useColorModeValue("yellow.800", "yellow.200")}
          p={6}
          rounded="xl"
          textAlign="center"
        >
          <Text fontWeight="medium">
            No places found nearby. Try changing your location.
          </Text>
        </Box>
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
                  onClick={() =>
                    navigate("/lastmile", { state: { destination: place.name } })
                  }
                >
                  Plan Last Mile
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