import { Toaster } from "@/components/ui/sonner";
import { Router } from "@/routes";
import { createRoot } from "react-dom/client";
import { FeedbackProvider } from "./providers/FeedbackProvider";
import { LlmProvider } from "./providers/LlmProvider";

function App() {
  return (
    <>
      <FeedbackProvider>
        <LlmProvider>
          <Router />
        </LlmProvider>
      </FeedbackProvider>
      <Toaster pauseWhenPageIsHidden />
    </>
  );
}

const app = document.createElement("div");
app.id = "root";
document.body.appendChild(app);
createRoot(app).render(<App />);
