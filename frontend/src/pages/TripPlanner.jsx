import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  VStack,
  HStack,
  Input,
  Text,
  useColorMode,
  IconButton,
  Spinner,
  Card,
  CardBody,
  CardHeader,
} from '@chakra-ui/react';
import { Moon, Sun, Send, User, Users, MapPin } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function TripPlanner() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('Checking...');

  useEffect(() => {
    axios
      .get(`${API_URL}/test`)
      .then((res) => setBackendStatus(res.data.message))
      .catch(() => setBackendStatus('Error connecting to backend'));
  }, []);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/chat`, { input: chatInput });
      setChatResponse(res.data.response);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setIsLoading(false);
      setChatInput('');
    }
  };

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
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


      {/* Main */}
      <Container maxW="3xl" py={16}>
        <VStack spacing={6} textAlign="center">
          <Heading color="teal.600">Your Next Journey, Optimized 🚀</Heading>
          <Text color="gray.500">
            Build, personalize, and optimize your itineraries with our free AI trip planner.
          </Text>
          <Text color="teal.500" fontWeight="medium">
            Backend status: {backendStatus}
          </Text>

          <Heading size="lg" color="teal.600">
            Trip Planner AI Chat is now available 🎉
          </Heading>

          {/* Chat Input */}
          <Flex as="form" w="full" onSubmit={handleChatSubmit}>
            <Input
              placeholder="Ask anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              mr={2}
            />
            <Button type="submit" colorScheme="teal" leftIcon={isLoading ? <Spinner size="sm" /> : <Send />}>
              {isLoading ? 'Loading...' : 'Send'}
            </Button>
          </Flex>

          {/* Error Message */}
          {error && (
            <Box p={4} bg="red.100" color="red.700" borderRadius="md">
              {error}
            </Box>
          )}

          {/* AI Response Card */}
          {chatResponse && (
            <Card w="full" borderRadius="md" shadow="md">
              <CardHeader>
                <Text fontWeight="bold" color="teal.600">
                  GoQuest AI Suggestion
                </Text>
              </CardHeader>
              <CardBody>
                <Text whiteSpace="pre-wrap">{chatResponse.replace(/\*/g, '')}</Text>
              </CardBody>
            </Card>
          )}

          {/* Last Mile Button */}
          {chatResponse && (
            <Button
              colorScheme="teal"
              leftIcon={<MapPin />}
              onClick={() => (window.location.href = '/last-mile')}
            >
              Plan Last-Mile Connectivity
            </Button>
          )}

          <Text fontSize="sm" color="gray.500">
            We'd love to hear your suggestions for improvement.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
