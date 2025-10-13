import { useEffect, useState } from "react";
import API from "../services/api";

function Destinations() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    API.get("/destinations/")
      .then((res) => setDestinations(res.data))
      .catch(() => alert("Error fetching destinations"));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Destinations</h1>
      <ul>
        {destinations.map((d) => (
          <li key={d.id}>
            <strong>{d.name}</strong> - {d.location} <br />
            {d.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Destinations;
