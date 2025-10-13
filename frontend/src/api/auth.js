import API from "./axios";

// Signup
export const signupUser = async (formData) => {
  const res = await API.post("/signup", formData);
  return res.data;
};

// Login
export const loginUser = async (credentials) => {
  const res = await API.post("/login", credentials);
  return res.data;
};
