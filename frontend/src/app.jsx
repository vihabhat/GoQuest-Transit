import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import Destinations from "./pages/destinations";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import TripPlanner from "./pages/TripPlanner";
import Gamification from "./pages/gamification";
import LastMile from "./pages/lastmile";
import Profile from "./pages/Profiles";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tripplanner" element={<TripPlanner/>} />
        <Route path="/gamification" element={<Gamification />} />
        <Route path ="/lastmile" element={<LastMile />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
