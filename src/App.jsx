// Import our supabase client
import { supabase } from "./lib/supabase";

// useEffect lets us run code after the component loads
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Try to fetch all jobs from the database
    // and log the result to the browser console
    supabase
      .from("jobs")
      .select("*")
      .then(({ data, error }) => {
        console.log("data:", data);
        console.log("error:", error);
      });
  }, []); // The empty [] means this only runs once when the page loads

  return <div>Testing Supabase connection...</div>;
}

export default App;
