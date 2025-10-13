import {
    Box,
    Button,
    Flex,
    Heading,
    Text,
    VStack,
    Image,
    HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaRobot, FaMapMarkedAlt } from "react-icons/fa";

function Landing() {
    const navigate = useNavigate();

    return (
        <Box minH="100vh" bg="gray.50">
            {/* Navbar */}
            <Flex
                justify="space-between"
                align="center"
                px={8}
                py={4}
                bg="white"
                boxShadow="md"
            >
                <Heading color="teal.500" size="lg" cursor="pointer" onClick={() => navigate("/")}>
                    GoQuest Transit
                </Heading>
                <HStack spacing={4}>

                    {/* Gamification / Nearby Destinations */}
                    <Button
                        colorScheme="teal"
                        leftIcon={<FaMapMarkedAlt />}
                        onClick={() => navigate("/gamification")}
                    >
                        Explore Nearby
                    </Button>
                    {/* AI Trip Planner */}
                    <Button
                        variant="ghost"
                        leftIcon={<FaRobot />}
                        onClick={() => navigate("/ai-trip-planner")}
                    >
                        AI Trip Planner
                    </Button>
                    {/* User Profile */}
                    <Button
                        variant="ghost"
                        leftIcon={<FaUserCircle />}
                        onClick={() => navigate("/profile")}
                    >
                        Profile
                    </Button>

                </HStack>
            </Flex>

            <Flex
                direction={{ base: "column", md: "row" }}
                align="center"
                justify="space-between"
                px={{ base: 6, md: 20 }}
                py={20}
            >
                <VStack align="start" spacing={6} maxW="lg">
                    <Heading size="2xl" color="gray.800">
                        Discover. Plan. Connect.
                    </Heading>
                    <Text fontSize="lg" color="gray.600">
                        Your all-in-one travel assistant to explore destinations and
                        simplify last-mile connectivity.
                    </Text>
                    <Button
                        colorScheme="teal"
                        size="lg"
                        onClick={() => navigate("/destinations")}
                    >
                        Explore Plans
                    </Button>
                </VStack>

                <Image
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                    alt="Travel"
                    borderRadius="xl"
                    mt={{ base: 10, md: 0 }}
                    boxShadow="2xl"
                    w={{ base: "100%", md: "45%" }}
                />
            </Flex>

            <Box bg="white" py={16} px={{ base: 6, md: 20 }}>
                <Heading size="lg" textAlign="center" mb={10} color="teal.600">
                    Why Choose GoQuest Transit?
                </Heading>
                <Flex
                    direction={{ base: "column", md: "row" }}
                    justify="space-around"
                    align="center"
                    gap={8}
                >
                    {[
                        {
                            title: "Smart Itineraries",
                            desc: "Plan weekend getaways and multi-stop trips effortlessly.",
                        },
                        {
                            title: "Last-Mile Solutions",
                            desc: "Seamless integration of travel and local transport.",
                        },
                        {
                            title: "Gamified Exploration",
                            desc: "Discover hidden gems and earn rewards while exploring.",
                        },
                    ].map((f, i) => (
                        <Box
                            key={i}
                            p={6}
                            borderWidth="1px"
                            borderRadius="xl"
                            textAlign="center"
                            w={{ base: "100%", md: "30%" }}
                            boxShadow="md"
                        >
                            <Heading size="md" mb={2} color="teal.500">
                                {f.title}
                            </Heading>
                            <Text color="gray.600">{f.desc}</Text>
                        </Box>
                    ))}
                </Flex>
            </Box>

            {/* Footer */}
            <Box bg="gray.800" color="white" textAlign="center" py={6}>
                <Text>© {new Date().getFullYear()} GoQuest Transit. All rights reserved.</Text>
            </Box>
        </Box>
    );
}

export default Landing;
