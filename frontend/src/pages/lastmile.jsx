import React, { useState, useEffect } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Icon,
    SimpleGrid,
    Flex,
    Spinner,
    useColorModeValue,
    Button,
} from "@chakra-ui/react";
import { FaBus, FaWalking, FaBicycle, FaSubway, FaTaxi, FaCar } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = { width: "100%", height: "500px" };
const API_URL = "http://localhost:5000";

const getIcon = (mode) => {
    switch (mode.toLowerCase()) {
        case "bus": return FaBus;
        case "walk": return FaWalking;
        case "e-scooter": return FaBicycle;
        case "metro": 
        case "metro/bus": return FaSubway;
        case "auto/cab":
        case "cab":
        case "auto": return FaTaxi;
        case "car":
        case "driving": return FaCar;
        default: return FaWalking;
    }
};

const getModeColor = (mode) => {
    switch (mode.toLowerCase()) {
        case "walk": return "#48BB78"; // green
        case "metro/bus": return "#3182CE"; // blue
        case "e-scooter": return "#ED8936"; // orange
        case "auto/cab":
        case "cab":
        case "auto": return "#F6E05E"; // yellow
        case "car":
        case "driving": return "#4A5568"; // gray
        default: return "#805AD5"; // purple
    }
};

// Decode Google's encoded polyline format
const decodePolyline = (encoded) => {
    if (!encoded) return [];
    
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return poly;
};

export default function LastMile() {
    const location = useLocation();
    const navigate = useNavigate();
    const destFromState = location.state?.destination || new URLSearchParams(location.search).get("destination");

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(destFromState);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(0);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    // 1️⃣ Get current location
    useEffect(() => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported by your browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setStart({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => alert("Unable to get your current location")
        );
    }, []);

    // 2️⃣ Set destination from previous page
    useEffect(() => {
        if (destFromState) setEnd(destFromState);
    }, [destFromState]);

    // 3️⃣ Fetch last-mile routes
    const fetchRoutes = async () => {
        if (!start || !end) return;

        if (isNaN(start.lat) || isNaN(start.lng) || !end) {
            console.error("Invalid parameters for last-mile API", start, end);
            return;
        }

        setLoading(true);
        try {
            const resp = await axios.get(`${API_URL}/api/last_mile`, {
                params: {
                    start_lat: start.lat,
                    start_lng: start.lng,
                    destination: end
                },
            });

            const routesData = resp.data.routes || [];
            // Decode polylines for each route
            const routesWithPaths = routesData.map(route => ({
                ...route,
                decodedPath: decodePolyline(route.polyline)
            }));
            
            setRoutes(routesWithPaths);
            console.log("Routes loaded:", routesWithPaths.length);
        } catch (err) {
            console.error("Axios error:", err);
            alert("Failed to fetch last-mile routes. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, [start, end]);

    const mapBg = useColorModeValue("white", "gray.800");
    const cardBg = useColorModeValue("white", "gray.700");

    // Calculate map center to show entire route
    const getMapCenter = () => {
        if (!start || routes.length === 0) return start;
        
        const selectedRouteData = routes[selectedRoute];
        if (!selectedRouteData) return start;

        return {
            lat: (start.lat + selectedRouteData.end_lat) / 2,
            lng: (start.lng + selectedRouteData.end_lng) / 2
        };
    };

    return (
        <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
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

            {/* Main Content */}
            <Box p={6} maxW="1400px" mx="auto">
                <Heading mb={6} textAlign="center">Last Mile Planner</Heading>

                <Flex direction={{ base: "column", md: "row" }} gap={6}>
                    {/* Left Panel: Info & Route Cards */}
                    <VStack flex="1" spacing={4} align="stretch" maxW={{ base: "100%", md: "400px" }}>
                        <Box p={4} borderRadius="md" shadow="md" bg={cardBg}>
                            <Text fontWeight="bold" mb={2}>Start Location</Text>
                            {start ? (
                                <Text fontSize="sm">Lat: {start.lat.toFixed(5)}, Lng: {start.lng.toFixed(5)}</Text>
                            ) : (
                                <Spinner size="sm" />
                            )}
                        </Box>

                        <Box p={4} borderRadius="md" shadow="md" bg={cardBg}>
                            <Text fontWeight="bold" mb={2}>Destination</Text>
                            {end ? <Text fontSize="sm">{end}</Text> : <Text color="gray.500">No destination selected</Text>}
                        </Box>

                        {loading && (
                            <Flex justify="center" align="center" py={8}>
                                <Spinner size="xl" color="teal.500" />
                            </Flex>
                        )}

                        {routes.length > 0 && (
                            <VStack spacing={3} mt={4}>
                                <Text fontWeight="bold" alignSelf="start">Available Routes</Text>
                                {routes.map((route, idx) => (
                                    <Box
                                        key={idx}
                                        p={4}
                                        borderWidth={2}
                                        borderColor={selectedRoute === idx ? "teal.500" : "gray.200"}
                                        borderRadius="lg"
                                        shadow={selectedRoute === idx ? "xl" : "md"}
                                        bg={selectedRoute === idx ? "teal.50" : cardBg}
                                        cursor="pointer"
                                        onClick={() => setSelectedRoute(idx)}
                                        _hover={{ 
                                            shadow: "xl", 
                                            transform: "scale(1.02)", 
                                            transition: "0.2s",
                                            borderColor: "teal.400"
                                        }}
                                        w="100%"
                                    >
                                        <HStack spacing={4} mb={2} justify="space-between">
                                            <HStack>
                                                <Icon 
                                                    as={getIcon(route.mode)} 
                                                    boxSize={6} 
                                                    color={getModeColor(route.mode)} 
                                                />
                                                <Text fontWeight="bold">{route.mode}</Text>
                                            </HStack>
                                            <VStack spacing={0} align="end">
                                                <Text fontSize="sm" fontWeight="bold">{route.duration}</Text>
                                                <Text fontSize="xs" color="gray.600">{route.distance}</Text>
                                            </VStack>
                                        </HStack>
                                        <Text 
                                            fontSize="sm" 
                                            color="gray.700" 
                                            dangerouslySetInnerHTML={{ __html: route.details }} 
                                        />
                                    </Box>
                                ))}
                            </VStack>
                        )}
                    </VStack>

                    {/* Right Panel: Map */}
                    <Box flex="2" borderRadius="md" overflow="hidden" shadow="lg">
                        {isLoaded && start ? (
                            <GoogleMap 
                                mapContainerStyle={containerStyle} 
                                center={getMapCenter()} 
                                zoom={13}
                                options={{
                                    zoomControl: true,
                                    streetViewControl: false,
                                    mapTypeControl: true,
                                    fullscreenControl: true,
                                }}
                            >
                                {/* Start Marker */}
                                <Marker 
                                    position={start} 
                                    label={{
                                        text: "Start",
                                        color: "white",
                                        fontWeight: "bold",
                                        fontSize: "12px"
                                    }}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 10,
                                        fillColor: "#48BB78",
                                        fillOpacity: 1,
                                        strokeColor: "white",
                                        strokeWeight: 2,
                                    }}
                                />
                                
                                {/* Route Polylines and End Markers */}
                                {routes.map((route, idx) => {
                                    // Only show the selected route
                                    if (idx !== selectedRoute) return null;

                                    const endPosition = { 
                                        lat: route.end_lat, 
                                        lng: route.end_lng 
                                    };

                                    return (
                                        <React.Fragment key={idx}>
                                            {/* End/Destination Marker */}
                                            <Marker 
                                                position={endPosition}
                                                label={{
                                                    text: "Dest",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    fontSize: "12px"
                                                }}
                                                icon={{
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 10,
                                                    fillColor: "#E53E3E",
                                                    fillOpacity: 1,
                                                    strokeColor: "white",
                                                    strokeWeight: 2,
                                                }}
                                            />
                                            
                                            {/* Actual Route Path from Google Directions */}
                                            {route.decodedPath && route.decodedPath.length > 0 && (
                                                <Polyline 
                                                    path={route.decodedPath} 
                                                    options={{ 
                                                        strokeColor: getModeColor(route.mode),
                                                        strokeWeight: 5,
                                                        strokeOpacity: 0.8,
                                                        geodesic: true
                                                    }} 
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </GoogleMap>
                        ) : (
                            <Flex 
                                h="500px" 
                                justify="center" 
                                align="center" 
                                bg={mapBg}
                                borderWidth={1} 
                                borderRadius="md"
                            >
                                <VStack>
                                    <Spinner size="xl" color="teal.500" />
                                    <Text color="gray.500">Loading map...</Text>
                                </VStack>
                            </Flex>
                        )}
                    </Box>
                </Flex>
            </Box>
        </Box>
    );
}