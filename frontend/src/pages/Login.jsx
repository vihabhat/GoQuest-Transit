import { useState } from "react";
import {
  Box,
  Button,
  Input,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Login successful 🚀",
          description: "Welcome back!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        localStorage.setItem("token", data.token);

        //  Redirect to landing page after success
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        toast({
          title: "Login failed",
          description: data.error || "Invalid credentials",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Server error",
        description: "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.100"
      p={6}
    >
      <Box w="sm" p={8} bg="white" boxShadow="lg" borderRadius="xl">
        <VStack spacing={4} align="stretch">
          <Heading size="lg" textAlign="center">
            GoQuest Transit Login
          </Heading>
          <Text fontSize="sm" textAlign="center" color="gray.600">
            Enter your credentials to continue
          </Text>

          <form onSubmit={handleSubmit}>
            <FormControl mb={4} isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>

            <FormControl mb={6} isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>

            <Button colorScheme="teal" type="submit" w="full">
              Login
            </Button>

            <Button
              variant="outline"
              w="full"
              mt={3}
              onClick={() => navigate("/signup")}
            >
              Create Account
            </Button>
          </form>
        </VStack>
      </Box>
    </Box>
  );
}

export default Login;
