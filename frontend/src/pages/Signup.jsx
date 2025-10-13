import React, { useState } from "react";
import { Box, Input, Button, VStack, Text } from "@chakra-ui/react";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
    address: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Signup successful! You can now log in.");
        setFormData({
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          dob: "",
          address: "",
        });
      } else {
        setMessage(data.error || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("Server error. Please try again later.");
    }
  };

  return (
    <Box
      minH="100vh"
      bgImage="url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e')"
      bgSize="cover"
      bgPos="center"
      bgRepeat="no-repeat"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="whiteAlpha.900"
        p={10}
        borderRadius="lg"
        boxShadow="xl"
        width={{ base: "100%", md: "400px" }}
        textAlign="center"
      >
        <Text fontSize="2xl" mb={6} color="teal.600" fontWeight="bold">
          Create an Account
        </Text>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Input
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Date of Birth"
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button colorScheme="teal" type="submit" width="full">
              Sign Up
            </Button>
          </VStack>
        </form>

        {message && (
          <Text mt={4} color="teal.600" fontWeight="medium">
            {message}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default Signup;
