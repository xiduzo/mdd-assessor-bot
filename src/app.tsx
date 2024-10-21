import { Button } from "@/components/ui/button";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div>
      <h1 className="text-red-500">hello world</h1>
      <Button>click me</Button>
    </div>
  );
}

const app = document.createElement("root");
document.body.appendChild(app);
createRoot(app).render(<App />);
