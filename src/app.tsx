import { FeedbackCelebrator } from "@/components/custom/FeedbackCelebrator";
import { FeedbackDialog } from "@/components/custom/FeedbackDialog";
import { Toaster } from "@/components/ui/sonner";
import { CelebrationProvider } from "@/providers/CelebrationProvider";
import { LlmProvider } from "@/providers/LlmProvider";
import { Router } from "@/routes";
import { createRoot } from "react-dom/client";

function App() {
    return (
        <>
            <CelebrationProvider>
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
