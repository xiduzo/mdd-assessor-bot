import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NumberTicker from "@/components/ui/number-ticker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLlm } from "@/providers/LlmProvider";
import { cva } from "class-variance-authority";
import { format } from "date-fns";
import {
  ArrowLeft,
  BotMessageSquare,
  BotOff,
  Folder,
  FolderOpen,
} from "lucide-react";
import { PropsWithChildren, useEffect, useState } from "react";
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

  return (
    <main className="min-h-lvh flex flex-col">
      <header className="flex justify-between p-4 sticky top-0">
        <Button
          aria-label="Go back"
          variant="ghost"
          size="icon"
          disabled={location.pathname === "/"}
          onClick={() => navigate(-1)}
        >
          {location.pathname !== "/" && <ArrowLeft />}
        </Button>
        <section className="space-x-2">
          <LlmAgent />
          <MyDocuments />
        </section>
      </header>
      <section className="container grow">{props.children}</section>
    </main>
  );
}

function LlmAgent() {
  const { models, model, setModel, status } = useLlm();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={llmAgentButton({ status: status })}
          aria-label="Select your LLM assessor"
        >
          {!status && <BotOff />}
          {status === "error" && <BotOff />}
          {status === "initializing" && <BotOff />}
          {status === "initialized" && <BotMessageSquare />}
          {model?.name ?? "No LLM selected"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" align="end">
        {models.map(({ name }) => (
          <DropdownMenuCheckboxItem
            key={name}
            checked={name === model?.name}
            disabled={name === model?.name}
            onClick={() => setModel(name)}
          >
            {name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const llmAgentButton = cva("", {
  variants: {
    status: {
      initializing: "animate-pulse text-muted-foreground",
      initialized: "",
      error: "text-red-600 hover:text-red-500",
    },
  },
});

type ReconstructedDocument = Pick<File, "name" | "lastModified"> & {
  text: string;
};
function MyDocuments() {
  const { documents, removeStudentDocuments } = useLlm();
  const [openDocument, setOpenDocument] = useState<ReconstructedDocument>();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function listener(event: KeyboardEvent) {
      if (!event.metaKey) return;

      switch (event.key) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          setOpenDocument((prev) => {
            if (prev) return prev;
            return documents.at(Number(event.key) - 1);
          });
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [documents]);

  return (
    <>
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`View your uploaded documents (${documents.length} documents)`}
          >
            {isOpen ? <FolderOpen /> : <Folder />}
            <Badge
              className={badge({
                folderOpen: isOpen,
              })}
              aria-hidden
            >
              <NumberTicker
                value={documents.length}
                className="text-white w-full"
              />
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!documents.length && (
            <DropdownMenuItem disabled>
              Mucho empty, your uploaded documents will appear here
            </DropdownMenuItem>
          )}
          {documents.map((doc, index) => (
            <DropdownMenuItem
              key={doc.name}
              onClick={() => setOpenDocument(doc)}
            >
              <div className="flex flex-col">
                {doc.name}
                <span className="text-muted-foreground text-xs">
                  File modified at{" "}
                  {format(doc.lastModified, "dd MMM yyyy HH:mm")}
                </span>
              </div>
              {index < 10 && (
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {openDocument && (
        <Dialog
          defaultOpen
          onOpenChange={(open) => {
            if (open) return;
            setOpenDocument(undefined);
          }}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{openDocument.name}</DialogTitle>
              <DialogDescription>
                ⚠️ The following text has been automatically extracted from the
                uploaded document. If you notice any missing content, it may be
                due to improper formatting of the original document. Please
                ensure that the document is correctly formatted for optimal
                extraction results.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[55vh] grow pr-4">
              {openDocument.text}
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  removeStudentDocuments([{ name: openDocument.name }]);
                  setOpenDocument(undefined);
                }}
              >
                Remove {openDocument.name}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

const badge = cva("absolute transition-all p-0 w-4 h-4 pointer-events-none", {
  variants: {
    folderOpen: {
      true: "scale-0 top-2 right-3",
      false: "top-0 right-0",
    },
  },
});
