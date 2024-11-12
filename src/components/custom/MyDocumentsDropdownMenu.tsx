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
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NumberTicker from "@/components/ui/number-ticker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMac } from "@/hooks/use-is-mac";
import { StudentDocument } from "@/lib/types";
import { useDocumentStore } from "@/stores/documentStore";
import { cva } from "class-variance-authority";
import { format } from "date-fns";
import { Folder, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";

export function MyDocumentsDropdownMenu() {
    const isMac = useIsMac();
    const { documents, remove } = useDocumentStore();
    const [openDocument, setOpenDocument] = useState<StudentDocument>();
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
                            Mucho empty, your uploaded documents will appear
                            here
                        </DropdownMenuItem>
                    )}
                    {documents.map((doc, index) => (
                        <DropdownMenuItem
                            key={doc.name}
                            onClick={() => setOpenDocument(doc)}
                        >
                            <div className="flex flex-col">
                                {doc.name}
                                <em className="text-muted-foreground text-xs">
                                    File modified at{" "}
                                    {format(
                                        doc.lastModified,
                                        "dd MMM yyyy HH:mm",
                                    )}
                                </em>
                            </div>
                            {index < 10 && (
                                <DropdownMenuShortcut>
                                    {isMac ? "⌘" : "⊞"}
                                    {index + 1}
                                </DropdownMenuShortcut>
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
                                ⚠️ The following text has been automatically
                                extracted from the uploaded document. If you
                                notice any missing content, it may be due to
                                improper formatting of the original document.
                                Please ensure that the document is correctly
                                formatted for optimal extraction results.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[55vh] grow pr-4">
                            {openDocument.text}
                        </ScrollArea>
                        <DialogFooter>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    remove(openDocument);
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
