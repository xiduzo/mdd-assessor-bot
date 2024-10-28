import { FeedbackDialog } from "@/components/custom/FeedbackDialog";
import { Toaster } from "@/components/ui/sonner";
import { competenciesWithIncidactors } from "@/lib/types";
import { FeedbackProvider, useFeedback } from "@/providers/FeedbackProvider";
import { LlmProvider } from "@/providers/LlmProvider";
import { Router } from "@/routes";
import { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadFull } from "tsparticles";
import { CelebrationProvider } from "./providers/CelebrationProvider";

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
        <FeedbackProvider>
          <LlmProvider>
            <Router />
            <FeedbackDialogInternal />
          </LlmProvider>
        </FeedbackProvider>
        <Toaster pauseWhenPageIsHidden />
      </CelebrationProvider>
    </>
  );
}

const app = document.createElement("div");
app.id = "root";
document.body.appendChild(app);
createRoot(app).render(<App />);

function FeedbackDialogInternal() {
  const { selectedFeedback } = useFeedback();

  const selectedCompetency = useMemo(() => {
    if (!selectedFeedback) {
      return;
    }

    return competenciesWithIncidactors.find(({ indicators }) =>
      indicators.map(({ name }) => name).includes(selectedFeedback.name),
    )?.name;
  }, [selectedFeedback]);

  if (!selectedFeedback) {
    return null;
  }
  if (!selectedCompetency) {
    return null;
  }

  return (
    <FeedbackDialog
      competency={selectedCompetency}
      indicator={selectedFeedback}
    />
  );
}
