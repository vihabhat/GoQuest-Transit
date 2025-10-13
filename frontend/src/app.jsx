import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import Destinations from "./pages/destinations";
import Landing from "./pages/Landing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;
