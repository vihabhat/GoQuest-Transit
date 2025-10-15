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

const TripPlanner = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;
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

        {/* Input Area */}
        <VStack spacing={4} align="stretch">
          <Textarea
            placeholder="Enter your travel query..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            size="md"
            resize="vertical"
            minH="100px"
            bg={colorMode === "light" ? "white" : "gray.700"}
          />
          <HStack justify="flex-end">
            <Button
              colorScheme="teal"
              rightIcon={<FaArrowRight />}
              onClick={handleSend}
              isLoading={loading}
              loadingText="Planning..."
            >
              Plan Trip
            </Button>
          </HStack>
        </VStack>

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
};

export default TripPlanner;
