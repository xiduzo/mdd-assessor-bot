import { Toaster } from "@/components/ui/sonner";
import { Router } from "@/routes";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

const app = document.createElement("div");
app.id = "root";
document.body.appendChild(app);
createRoot(app).render(<App />);
