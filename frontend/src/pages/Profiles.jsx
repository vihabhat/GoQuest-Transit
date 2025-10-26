import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  useToast,
  Avatar,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
// Use react-icons/fa or similar in a real project, but using mock icons for now
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt, FaSignOutAlt, FaEdit } from 'react-icons/fa';

// Replace your mock icons with actual imports for better visual consistency
const UserIcon = FaUser;
const MailIcon = FaEnvelope;
const PhoneIcon = FaPhone;
const MapIcon = FaMapMarkerAlt;
const CalendarIcon = FaCalendarAlt;
const LogoutIcon = FaSignOutAlt;
const EditIcon = FaEdit;

function Profile() {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
  });
  const toast = useToast();

  const API_URL = "http://127.0.0.1:5000/auth/profile";

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast({
          title: "Session required",
          description: "Please log in to view your profile.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        navigate("/login");
        return;
      }

      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        // Initialize form data with fetched user data
        setFormData({
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          // Ensure DOB is formatted as 'YYYY-MM-DD' for the input type="date"
          dob: data.dob && data.dob.split('T')[0] || "", 
          address: data.address || "",
        });
      } else if (res.status === 401) {
        // Handle token expiration/invalid
        handleLogout(false); // Log out without showing 'logged out' message
        toast({
          title: "Session expired",
          description: "Please log in again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
         const errorData = await res.json();
         throw new Error(errorData.error || "Failed to load profile.");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error fetching profile",
        description: err.message || "Could not load profile data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Profile updated 🎉",
          description: "Your profile has been updated successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setUserData(data);
        // Re-set formData just in case the backend returns a canonical format
        setFormData(prev => ({ 
            ...prev,
            dob: data.dob && data.dob.split('T')[0] || data.dob, 
            username: data.username
        }));
        setIsEditing(false);
      } else {
        toast({
          title: "Update failed",
          description: data.error || "Could not update profile.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Server error",
        description: "Could not connect to update service.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
    
  // Added a quiet parameter to prevent multiple log out toasts
  const handleLogout = (showToast = true) => {
    localStorage.removeItem("token");
    if (showToast) {
        toast({
            title: "Logged out",
            description: "You have been logged out successfully.",
            status: "info",
            duration: 2000,
            isClosable: true,
        });
    }
    navigate("/login");
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8} px={4}>
      <Box maxW="4xl" mx="auto">
        {/* Header Section */}
        <Box bg="white" borderRadius="xl" boxShadow="md" p={8} mb={6}>
          <HStack justify="space-between" mb={6} flexWrap="wrap" gap={4}>
            <HStack spacing={4}>
              <Avatar
                size="xl"
                name={userData?.username || "User"}
                bg="teal.500"
                color="white"
                // Initial is the first letter of the username
                children={userData?.username ? userData.username[0].toUpperCase() : "U"} 
              />
              <VStack align="start" spacing={1}>
                <Heading size="lg">{userData?.username || "Guest User"}</Heading>
                <Badge colorScheme="green" fontSize="sm">
                  {userData?.member_status || "Active Member"}
                </Badge>
              </VStack>
            </HStack>
            <Button
              leftIcon={<LogoutIcon />}
              colorScheme="red"
              variant="outline"
              onClick={() => handleLogout(true)}
            >
              Logout
            </Button>
          </HStack>
        </Box>

        {/* Profile Details Section */}
        <Box bg="white" borderRadius="xl" boxShadow="md" p={8}>
          <Tabs colorScheme="teal">
            <TabList>
              <Tab>Profile Information</Tab>
              <Tab>Account Settings</Tab>
            </TabList>

            <TabPanels>
              {/* Profile Information Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <HStack justify="space-between" flexWrap="wrap" gap={4}>
                    <Heading size="md">Personal Information</Heading>
                    <Button
                      leftIcon={<EditIcon />}
                      colorScheme="teal"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Cancel Edit" : "Edit Profile"}
                    </Button>
                  </HStack>

                  <Divider />

                  {isEditing ? (
                    <Box as="form" onSubmit={handleUpdate}>
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel>Username</FormLabel>
                          <Input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            isRequired
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Email</FormLabel>
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Phone Number</FormLabel>
                          <Input
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Date of Birth</FormLabel>
                          <Input
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleChange}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Address</FormLabel>
                          <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address"
                          />
                        </FormControl>

                        <HStack spacing={4} w="full" pt={4}>
                          <Button colorScheme="teal" type="submit" flex={1}>
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            flex={1}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {/* Read-Only Display */}
                      {[
                        { label: "Username", value: userData?.username, icon: UserIcon },
                        { label: "Email", value: userData?.email, icon: MailIcon },
                        { label: "Phone", value: userData?.phone, icon: PhoneIcon },
                        { label: "Date of Birth", value: userData?.dob, icon: CalendarIcon },
                        { label: "Address", value: userData?.address, icon: MapIcon },
                      ].map((item, index) => (
                        <HStack key={index} p={4} bg="gray.50" borderRadius="md" align="center">
                          <Box as={item.icon} fontSize="xl" color="teal.500" mr={3} />
                          <Box flex={1}>
                            <Text fontSize="sm" color="gray.600">
                              {item.label}
                            </Text>
                            <Text fontWeight="medium" color="gray.800">
                              {item.value || "Not set"}
                            </Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </TabPanel>

              {/* Account Settings Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Account Settings</Heading>
                  <Divider />
                  
                  {/* Change Password */}
                  <Box p={4} bg="yellow.50" borderRadius="md" borderLeft="4px" borderColor="yellow.400">
                    <Text fontWeight="medium" color="yellow.800">
                      Change Password
                    </Text>
                    <Text fontSize="sm" color="yellow.700" mt={2}>
                      For security, you may be redirected to a dedicated password reset page or guided to contact support.
                    </Text>
                    <Button colorScheme="yellow" size="sm" mt={3} variant="solid">
                      Reset Password
                    </Button>
                  </Box>

                  {/* Delete Account */}
                  <Box p={4} bg="red.50" borderRadius="md" borderLeft="4px" borderColor="red.400">
                    <Text fontWeight="medium" color="red.800">
                      Delete Account
                    </Text>
                    <Text fontSize="sm" color="red.700" mt={2}>
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </Text>
                    <Button colorScheme="red" size="sm" mt={3}>
                      Delete Account
                    </Button>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;