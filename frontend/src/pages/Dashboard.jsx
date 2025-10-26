import React from "react";
import { Box, Flex, Heading, Text, Button, HStack, ScaleFade } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaPlane, FaRoute } from "react-icons/fa";

function Dashboard() {
    const navigate = useNavigate();

    const features = [
        {
            title: "AI Trip Planner",
            description:
                "Plan multi-stop trips and weekend getaways effortlessly using our AI-powered planner.",
            buttonText: "Go to Trip Planner",
            route: "/tripplanner",
        },
        {
            title: "Explore Nearby Destinations",
            description:
                "Discover nearby tourist spots and attractions using Google Maps integration.",
            buttonText: "Explore Nearby",
            route: "/gamification",
        },
        {
            title: "Last-Mile Connectivity",
            description:
                "Seamlessly plan your local transport options for smooth travel experiences.",
            buttonText: "View Connectivity Options",
            route: "/lastmile",
        },
    ];

    return (
        <Box
            minH="100vh"
            position="relative"
            bgImage="url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e')"
            bgSize="cover"
            bgPos="center"
            bgRepeat="no-repeat"
            overflow="hidden"
        >
            {/* Overlay for readability */}
            <Box
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                bg="blackAlpha.600"
                zIndex={0}
            />

            {/* Floating travel icons */}
            <FaMapMarkerAlt className="floatingIcon" style={{ top: "10%", left: "20%" }} />
            <FaPlane className="floatingIcon" style={{ top: "40%", left: "80%" }} />
            <FaRoute className="floatingIcon" style={{ top: "70%", left: "30%" }} />
            <FaMapMarkerAlt className="floatingIcon" style={{ top: "60%", left: "50%" }} />

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

            {/* Dashboard Main */}
            <Flex
                direction="column"
                align="center"
                justify="center"
                py={20}
                px={{ base: 6, md: 20 }}
                gap={12}
                position="relative"
                zIndex={1}
            >
                <Heading
                    color="white"
                    mb={10}
                    textShadow="2px 2px 6px rgba(0,0,0,0.8)"
                    fontSize={{ base: "3xl", md: "5xl" }}
                    textAlign="center"
                >
                    Welcome to Your Dashboard
                </Heading>

                <Flex
                    direction={{ base: "column", md: "row" }}
                    flexWrap="wrap"
                    justify="center"
                    align="center"
                    gap={8}
                >
                    {features.map((feature, index) => (
                        <ScaleFade in={true} initialScale={0.8} key={index} delay={index * 0.2}>
                            <Box
                                bg="whiteAlpha.800"
                                p={8}
                                borderRadius="xl"
                                width={{ base: "100%", md: "300px" }}
                                boxShadow="lg"
                                textAlign="center"
                                transition="all 0.3s ease"
                                _hover={{
                                    transform: "scale(1.05)",
                                    boxShadow: "2xl",
                                }}
                            >
                                <Heading size="md" mb={4} color="teal.600">
                                    {feature.title}
                                </Heading>
                                <Text mb={6} color="gray.700">
                                    {feature.description}
                                </Text>
                                <Button
                                    colorScheme="teal"
                                    size="md"
                                    onClick={() => navigate(feature.route)}
                                    _hover={{ bg: "teal.700", transform: "scale(1.05)" }}
                                    transition="all 0.2s"
                                >
                                    {feature.buttonText}
                                </Button>
                            </Box>
                        </ScaleFade>
                    ))}
                </Flex>
            </Flex>

            {/* Floating icons animation */}
            <style>
                {`
          .floatingIcon {
            position: absolute;
            font-size: 2rem;
            color: #ffdd00;
            animation: float 6s ease-in-out infinite;
          }

          @keyframes float {
            0% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
            100% { transform: translateY(0px) translateX(0px); }
          }
        `}
            </style>
        </Box>
    );
}

export default Dashboard;
