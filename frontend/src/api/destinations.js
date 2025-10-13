import API from "./axios";

// Get all destinations
export const getDestinations = async () => {
  const res = await API.get("/destinations/");
  return res.data;
};

// Get one destination by ID
export const getDestination = async (id) => {
  const res = await API.get(`/destinations/${id}`);
  return res.data;
};

// Add new destination
export const addDestination = async (formData) => {
  const res = await API.post("/destinations/", formData);
  return res.data;
};

// Update destination
export const updateDestination = async (id, formData) => {
  const res = await API.put(`/destinations/${id}`, formData);
  return res.data;
};

// Delete destination
export const deleteDestination = async (id) => {
  const res = await API.delete(`/destinations/${id}`);
  return res.data;
};
