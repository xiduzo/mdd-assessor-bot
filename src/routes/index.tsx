import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLlm } from "@/providers/LlmProvider";
import { cva } from "class-variance-authority";
import { format } from "date-fns";
import {
  ArrowLeft,
  Bot,
  BotMessageSquare,
  BotOff,
  FileDigit,
  Folder,
  FolderOpen
} from "lucide-react";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  createBrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate
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
          aria-label="Go back"
          variant="ghost"
          size="icon"
          disabled={location.pathname === "/"}
          onClick={() => navigate(-1)}
        >
          {location.key !== "default" && <ArrowLeft />}
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
  const { models, model, setModel, embeddings, setEmbeddings, status } =
    useLlm();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={llmAgent({ status: status })}
          aria-label="Select your LLM assessor"
        >
          {status === "initializing" && <BotOff />}
          {status === "initialized" && <Bot />}
          {model}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <BotMessageSquare size={16} className="mr-2" />
            <span>Feedback model</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {models.map((m) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={m.name}
                    checked={m.name === model}
                    disabled={m.name === model}
                    onClick={() => setModel(m.name)}
                  >
                    <span>{m.name}</span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileDigit size={16} className="mr-2" />
            <span>Embeddings model</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {models.map((m) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={m.name}
                    checked={m.name === embeddings}
                    disabled={m.name === embeddings}
                    onClick={() => setEmbeddings(m.name)}
                  >
                    <span>{m.name}</span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
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

type ReconstructedDocument = Pick<File, "name" | "lastModified"> & {
  text: string;
};
function MyDocuments() {
  const { documents, removeStudentDocuments } = useLlm();
  const [openDocument, setOpenDocument] = useState<ReconstructedDocument>();
  const [isOpen, setIsOpen] = useState(false);

  const myDocuments = useMemo(() => {
    const uniqueDocuments: Map<string, ReconstructedDocument> = new Map();

    documents.forEach((doc) => {
      const content = uniqueDocuments.get(doc.metadata.name);
      if (content) {
        uniqueDocuments.set(doc.metadata.name, {
          ...content,
          text: content.text + " " + doc.pageContent,
        });
        return;
      }

      uniqueDocuments.set(doc.metadata.name, {
        ...doc.metadata,
        text: doc.pageContent,
      });
    });

    return Array.from(uniqueDocuments.values());
  }, [documents]);

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
            return myDocuments.at(Number(event.key) - 1);
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
  }, [myDocuments]);

  return (
    <>
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`View my uploaded documents (${myDocuments.length} documents)`}
          >
            {isOpen ? <FolderOpen /> : <Folder />}
            <Badge
              className={badge({
                folderOpen: isOpen
              })}
              aria-hidden
            >
              {myDocuments.length}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!myDocuments.length && (
            <DropdownMenuItem disabled>
              Mucho empty , your uploaded documents will appear here
            </DropdownMenuItem>
          )}
          {myDocuments.map((doc, index) => (
            <DropdownMenuItem
              key={doc.name}
              onClick={() => {
                console.log(doc);
                setOpenDocument(doc);
              }}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{openDocument.name}</DialogTitle>
              <DialogDescription>
                {format(openDocument.lastModified, "dd MMM yyyy HH:mm")}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[55vh] grow">
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
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

const badge = cva(
  "absolute transition-all p-0 w-4 h-4 text-xs flex items-center justify-center pointer-events-none",
  {
    variants: {
      folderOpen: {
        true: "scale-0 top-2 right-3",
        false: "top-0 right-0",
      },
      hasNewDocument: {
        true: 'animate-bounce',
        false: ''
      }
    },
  },
);
