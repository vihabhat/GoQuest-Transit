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
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Tag,
  TagLabel,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import {
  FaArrowRight,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import axios from "axios";

export default function TripPlanner() {
  const [tripPlan, setTripPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    origin_city: "",
    start_date: "",
    end_date: "",
    budget_usd: 1000,
    traveler_count: 2,
    interests: [],
    pace: "balanced",
  });

  const { colorMode, toggleColorMode } = useColorMode();

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle interests
  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePlanTrip = async () => {
  try {
    setLoading(true);
    setError(null);

    const {
      origin_city,
      start_date,
      end_date,
      budget_usd,
      traveler_count,
      interests,
      pace,
    } = formData;

    // Calculate trip duration
    const days =
      start_date && end_date
        ? Math.ceil(
            (new Date(end_date) - new Date(start_date)) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : "";

    // Build the AI prompt
    const prompt = `
      Plan a ${days}-day ${pace.toLowerCase()} trip to ${origin_city}.
      There will be ${traveler_count} travelers with a total budget of $${budget_usd}.
      The interests are: ${interests.join(", ") || "general sightseeing"}.
      Please provide a day-by-day itinerary with key attractions, local food recommendations, and travel tips.
    `;

    const response = await axios.post("http://127.0.0.1:5000/api/ai_trip", {
      prompt: prompt.trim(),
    });

    setTripPlan(response.data.data);
  } catch (error) {
    console.error("Trip generation error:", error);
    setError("Failed to generate trip plan. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <Box minH="100vh" bg="gray.50" py={10}>
      <Container maxW="container.xl">
        <Flex
          justify="space-between"
          align="center"
          px={8}
          py={4}
          bg="whiteAlpha.900"
          boxShadow="sm"
          borderBottom="1px"
          borderColor="gray.200"
        >
          {/* Logo / Brand */}
          <Heading
            size="lg"
            color="teal.500"
            cursor="pointer"
            onClick={() => navigate("/")}
          >
            GoQuest Transit
          </Heading>

          {/* Navigation Links */}
          <HStack spacing={6}>
            <Button
              variant="ghost"
              colorScheme="teal"
              onClick={() => navigate("/tripplanner")}
            >
              AI Trip Planner
            </Button>
            <Button
              variant="ghost"
              colorScheme="teal"
              onClick={() => navigate("/gamification")}
            >
              Explore Nearby
            </Button>
            <Button
              variant="ghost"
              colorScheme="teal"
              onClick={() => navigate("/profile")}
            >
              Profile
            </Button>
          </HStack>

          {/* Theme Toggle */}
          <IconButton
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            aria-label="Toggle theme"
            variant="ghost"
            colorScheme="teal"
          />
        </Flex>


        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Trip Planning Form */}
          <Card>
            <CardHeader>
              <Heading size="md">Plan Your Trip</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Destination City</FormLabel>
                  <Input
                    placeholder="e.g., Paris, Tokyo, New York"
                    value={formData.origin_city}
                    onChange={(e) =>
                      handleInputChange("origin_city", e.target.value)
                    }
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>Start Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        handleInputChange("start_date", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>End Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        handleInputChange("end_date", e.target.value)
                      }
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>Budget (USD)</FormLabel>
                    <NumberInput
                      value={formData.budget_usd || ""}
                      onChange={(_, valueAsNumber) =>
                        handleInputChange(
                          "budget_usd",
                          isNaN(valueAsNumber) ? "" : valueAsNumber
                        )
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Travelers</FormLabel>
                    <NumberInput
                      value={formData.traveler_count || ""}
                      onChange={(_, valueAsNumber) =>
                        handleInputChange(
                          "traveler_count",
                          isNaN(valueAsNumber) ? "" : valueAsNumber
                        )
                      }
                      min={1}
                      max={10}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Travel Pace</FormLabel>
                  <Select
                    value={formData.pace}
                    onChange={(e) =>
                      handleInputChange("pace", e.target.value)
                    }
                  >
                    <option value="relaxed">Relaxed</option>
                    <option value="balanced">Balanced</option>
                    <option value="packed">Packed</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Interests</FormLabel>
                  <HStack spacing={2} wrap="wrap">
                    {[
                      "culture",
                      "food",
                      "nature",
                      "history",
                      "nightlife",
                      "shopping",
                      "adventure",
                      "art",
                    ].map((interest) => (
                      <Tag
                        key={interest}
                        size="md"
                        colorScheme={
                          formData.interests.includes(interest)
                            ? "teal"
                            : "gray"
                        }
                        cursor="pointer"
                        onClick={() => handleInterestToggle(interest)}
                      >
                        <TagLabel>{interest}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </FormControl>

                {error && (
                  <Alert status="error">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                <Button
                  colorScheme="teal"
                  size="lg"
                  onClick={handlePlanTrip}
                  isLoading={loading}
                  loadingText="Planning..."
                  leftIcon={<FaArrowRight />}
                >
                  Generate Trip Plan
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Trip Plan Display */}
          <Card>
            <CardHeader>
              <Heading size="md">Your Trip Plan</Heading>
            </CardHeader>
            <CardBody>
              {!tripPlan && !loading && (
                <Text color="gray.500" textAlign="center" py={8}>
                  Fill out the form and click "Generate Trip Plan" to see your
                  personalized itinerary.
                </Text>
              )}

              {loading && (
                <Flex justify="center" py={8}>
                  <VStack>
                    <Spinner size="lg" />
                    <Text>Generating your trip plan...</Text>
                  </VStack>
                </Flex>
              )}

              {tripPlan && (
                <VStack spacing={6} align="stretch">
                  {/* Trip Summary */}
                  <Box p={4} bg="teal.50" borderRadius="md">
                    <Heading size="sm" mb={2}>
                      {tripPlan.summary?.title}
                    </Heading>
                    <HStack spacing={4}>
                      <Badge colorScheme="blue">
                        {tripPlan.summary?.duration_days} days
                      </Badge>
                      <Badge colorScheme="green">
                        ${tripPlan.summary?.estimated_total_cost_usd}
                      </Badge>
                    </HStack>
                  </Box>

                  {/* Daily Itinerary */}
                  {tripPlan.days?.map((day, dayIndex) => (
                    <Box
                      key={dayIndex}
                      p={4}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                    >
                      <Heading size="sm" mb={3}>
                        Day {dayIndex + 1} - {day.date}
                      </Heading>

                      <VStack spacing={3} align="stretch">
                        {day.activities?.map((activity, actIndex) => (
                          <Box
                            key={actIndex}
                            p={3}
                            bg="gray.50"
                            borderRadius="md"
                          >
                            <HStack justify="space-between" mb={2}>
                              <Text fontWeight="bold">
                                {activity.name}
                              </Text>
                              <Badge colorScheme="purple">
                                ${activity.cost_usd}
                              </Badge>
                            </HStack>
                            <HStack spacing={4} mb={2}>
                              <HStack>
                                <FaMapMarkerAlt size="12" />
                                <Text fontSize="sm">
                                  {activity.location}
                                </Text>
                              </HStack>
                              <HStack>
                                <FaClock size="12" />
                                <Text fontSize="sm">
                                  {activity.start_time} - {activity.end_time}
                                </Text>
                              </HStack>
                            </HStack>
                            {activity.notes && (
                              <Text fontSize="sm" color="gray.600">
                                {activity.notes}
                              </Text>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  ))}

                  {/* Travel Tips */}
                  {tripPlan.tips?.length > 0 && (
                    <Box p={4} bg="yellow.50" borderRadius="md">
                      <Heading size="sm" mb={2}>
                        Travel Tips
                      </Heading>
                      <VStack spacing={1} align="stretch">
                        {tripPlan.tips.map((tip, tipIndex) => (
                          <Text key={tipIndex} fontSize="sm">
                            • {tip}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
