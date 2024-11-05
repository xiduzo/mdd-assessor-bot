import { FeedbackCelebrator } from "@/components/custom/FeedbackCelebrator";
import { FeedbackDialog } from "@/components/custom/FeedbackDialog";
import { Toaster } from "@/components/ui/sonner";
import { CelebrationProvider } from "@/providers/CelebrationProvider";
import { LlmProvider } from "@/providers/LlmProvider";
import { Router } from "@/routes";
import { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadFull } from "tsparticles";

function App() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <>
      <CelebrationProvider init={init}>
        <LlmProvider>
          <Router />
        </LlmProvider>
        <FeedbackDialog />
        <FeedbackCelebrator />
        <Toaster pauseWhenPageIsHidden />
      </CelebrationProvider>
    </>
  );
}

const app = document.createElement("div");
app.id = "root";
document.body.appendChild(app);
createRoot(app).render(<App />);
