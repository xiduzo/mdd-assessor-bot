import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLlm } from "@/providers/LlmProvider";
import { cva } from "class-variance-authority";
import { format } from "date-fns";
import { ArrowLeft, Bot, BotOff, Folder, FolderOpen } from "lucide-react";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  createBrowserRouter,
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
    <BrowserRouter future={{ v7_startTransition: true }}>
      <Layout>
        <Routes>
          <Route path="/" Component={HomeRoute} />
          <Route path="/result" Component={ResultRoute} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function Layout(props: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <main className="min-h-lvh flex flex-col">
      <header className="flex justify-between p-4 sticky top-0">
        <Button
          variant="ghost"
          size="icon"
          disabled={location.key === "default"}
          onClick={() => navigate(-1)}
        >
          {location.key !== "default" && <ArrowLeft />}
        </Button>
        <section>
          <LlmAgent />
          <MyDocuments />
        </section>
      </header>
      <section className="container grow">{props.children}</section>
    </main>
  );
}

function LlmAgent() {
  const { model, status } = useLlm();

  return (
    <Button variant="ghost" disabled className={llmAgent({ status: status })}>
      {status === "initializing" && <BotOff />}
      {status === "initialized" && <Bot />}
      {model}
    </Button>
  );
}

const llmAgent = cva("", {
  variants: {
    status: {
      initializing: "animate-pulse",
      initialized: "",
      error: "text-red-500",
    },
  },
});

function MyDocuments() {
  const { documents } = useLlm();
  const [isOpen, setIsOpen] = useState(false);

  const myDocuments = useMemo(() => {
    const uniqueDocuments: Map<
      string,
      Pick<File, "name" | "lastModified">
    > = new Map();

    documents.forEach((doc) => {
      uniqueDocuments.set(doc.metadata.name, doc.metadata);
    });

    console.log(uniqueDocuments);

    return Array.from(uniqueDocuments.values());
  }, [documents]);

  useEffect(() => {
    function listener(event: KeyboardEvent) {
      console.log("keydown");
    }
    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isOpen ? <FolderOpen /> : <Folder />}
          {/* <FolderOpen size={24} /> */}
          <Badge className="absolute -top-0 -right-0 p-0 w-4 h-4 text-xs flex items-center justify-center pointer-events-none">
            {myDocuments.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!myDocuments.length && (
          <DropdownMenuItem disabled>No documents found</DropdownMenuItem>
        )}
        {myDocuments.map((doc, index) => (
          <DropdownMenuItem key={doc.name}>
            <div className="flex flex-col">
              {doc.name}
              <span className="text-muted-foreground">
                File modified at {format(doc.lastModified, "dd MMM yyyy HH:mm")}
              </span>
            </div>
            <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
          </DropdownMenuItem>
        ))}
        {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Team</DropdownMenuItem>
        <DropdownMenuItem>Subscription</DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
