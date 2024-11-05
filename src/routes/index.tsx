import { LlmAgentDropdownMenu } from "@/components/custom/LlmAgentDropdownMenu";
import { MyDocumentsDropdownMenu } from "@/components/custom/MyDocumentsDropdownMenu";
import { Button } from "@/components/ui/button";
import { useLlm } from "@/providers/LlmProvider";
import { ArrowLeft } from "lucide-react";
import { PropsWithChildren } from "react";
import {
  createBrowserRouter,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { HomeRoute } from "./home";
import { ResultRoute } from "./result";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
  },
  {
    path: "/result",
    element: <ResultRoute />,
  },
]);

export function Router() {
  return (
    <MemoryRouter future={{ v7_startTransition: true }}>
      <Layout>
        <Routes>
          <Route path="/" Component={HomeRoute} />
          <Route path="/result" Component={ResultRoute} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
}

function Layout(props: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clear } = useLlm();

  return (
    <main className="min-h-lvh flex flex-col">
      <header className="flex justify-between p-4 sticky top-0">
        <Button
          aria-label="Go back"
          variant="ghost"
          size="icon"
          disabled={location.pathname === "/"}
          onClick={() => {
            clear();
            navigate(-1);
          }}
        >
          {location.pathname !== "/" && <ArrowLeft />}
        </Button>
        <section className="space-x-2">
          <LlmAgentDropdownMenu />
          <MyDocumentsDropdownMenu />
        </section>
      </header>
      <section className="container grow">{props.children}</section>
    </main>
  );
}
