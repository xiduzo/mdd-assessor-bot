import { ParrotHead } from "@/components/custom/ParrotHead";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import FlickeringGrid from "@/components/ui/flickering-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    IpcPdfParseRequest,
    IpcPdfParseResponse,
    IPC_CHANNEL,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCelebration } from "@/providers/CelebrationProvider";
import { useDocumentStore } from "@/stores/documentStore";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { useLlmStore } from "@/stores/llmStore";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cva, VariantProps } from "class-variance-authority";
import {
    File,
    FileDigit,
    FilePlus,
    FileX2,
    Sparkles,
    Trash,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useInterval, useLocalStorage } from "usehooks-ts";

const MEGA_BYTE = 1024 * 1024;
const MAX_FILE_SIZE_IN_MB = 100;
const MAX_FILE_SIZE = MEGA_BYTE * MAX_FILE_SIZE_IN_MB;

export function HomeRoute() {
    const [isFistTimeFeedback, setIsFirstTimeFeedback] = useLocalStorage(
        "first-time-feedback",
        true,
    );

    const { celebrate } = useCelebration();
    const { models } = useLlmStore();

    const { documents } = useDocumentStore();
    const { clearAll } = useFeedbackStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [active, setActive] = useState(false);
    const [autoAnimateRef] = useAutoAnimate();

    const removeFile = useCallback(({ name }: File) => {
        setFiles((prev) => prev.filter((file) => file.name !== name));
    }, []);

    function getFeedback() {
        if (isFistTimeFeedback) {
            setIsFirstTimeFeedback(false);
            celebrate("That's the spirit, you'll be going places!");
        }
        clearAll();
        navigate("/result");
    }

    return (
        <>
            <article className="text-center flex flex-col space-y-12">
                <header className="flex flex-col items-center">
                    <ParrotHead className="w-40 h-40" />
                    <h1 className="font-semibold text-4xl">
                        Let's review your documents 👀
                    </h1>
                    <AnimatedGridPattern
                        maxOpacity={0.1}
                        numSquares={30}
                        y={8}
                        className={cn(
                            `[mask-image:radial-gradient(800px_circle_at_top,white,transparent,transparent)]`,
                            `lg:[mask-image:radial-gradient(900px_circle_at_top,white,transparent,transparent)]`,
                            `2xl:[mask-image:radial-gradient(1000px_circle_at_top,white,transparent,transparent)]`,
                            "inset-x-0 -inset-y-10 -z-10",
                        )}
                    />
                </header>
                <section className="grow space-y-4" ref={autoAnimateRef}>
                    {files.map((file) => (
                        <FileUploader
                            key={file.name}
                            file={file}
                            removeFile={removeFile}
                        />
                    ))}
                    {!files.length && (
                        <section className={dropArea({ active: active })}>
                            <Label
                                htmlFor="file"
                                aria-label={`Upload new files, PDF - max. ${MAX_FILE_SIZE_IN_MB} MB per file`}
                                className="flex flex-col items-center justify-end space-y-4"
                            >
                                <FilePlus className="text-muted-foreground" />
                                <section className="space-y-2">
                                    <div>
                                        <span className="font-bold">
                                            Click to upload
                                        </span>{" "}
                                        or drag and drop
                                    </div>
                                    <em className="inline-block text-muted-foreground">
                                        <code>.pdf</code> files, max.{" "}
                                        {MAX_FILE_SIZE_IN_MB} MB per file
                                    </em>
                                </section>
                            </Label>
                            <Input
                                id="file"
                                type="file"
                                accept="application/pdf"
                                multiple
                                disabled={files.length > 0}
                                className="absolute inset-0 h-full cursor-pointer opacity-0"
                                onChange={(event) => {
                                    setActive(false);
                                    if (!event.target.files?.length) return;

                                    const newFiles = Array.from(
                                        event.target.files,
                                    ).filter((file) => {
                                        if (file.type !== "application/pdf") {
                                            toast.warning(file.name, {
                                                description:
                                                    "Only PDF files are allowed",
                                            });
                                            return;
                                        }

                                        if (file.size > MAX_FILE_SIZE) {
                                            toast.warning(file.name, {
                                                description: `Your file is too large (${readableByteSize(file.size)}), max ${MAX_FILE_SIZE_IN_MB} MB`,
                                            });
                                            return;
                                        }

                                        return file;
                                    });

                                    setFiles(newFiles);
                                }}
                                onDragEnter={() => {
                                    setActive(true);
                                }}
                                onDragLeave={() => {
                                    setActive(false);
                                }}
                            />
                        </section>
                    )}
                    {active && (
                        <div className="text-muted-foreground">
                            Drop it like its 🔥
                        </div>
                    )}
                </section>
            </article>
            <aside className="flex flex-col items-center space-y-10 left-0 absolute w-full bottom-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            disabled={
                                !documents.length ||
                                !!files.length ||
                                !models.length
                            }
                        >
                            {!documents.length &&
                                "Upload documents to receive feedback"}
                            {!!documents.length && <Sparkles aria-hidden />}
                            {!!documents.length && "I want feedback"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-screen-lg">
                        <DialogHeader>
                            <DialogTitle>⚠️ Disclaimer ⚠️</DialogTitle>
                            <DialogDescription>
                                Before receiving feedback, please read the
                                following part carefully
                            </DialogDescription>
                        </DialogHeader>

                        <ol className="list-decimal list-inside space-y-1">
                            <li>
                                This tool is not meant to give you any
                                orientation on your actual future grading with
                                an assessment committee, this tool is only
                                provided as an experiment on using LLMs for the
                                writing process of MDD submissions.
                            </li>
                            <li>
                                It checks your writing against the set of
                                indicators, as interpreted by an LLM.
                            </li>
                            <li>
                                We think LLMs can be very useful as writing aids{" "}
                                <strong>if used well</strong>
                            </li>
                            <li>
                                The grades and feedback that you get from this
                                tool will likely differ greatly from what your
                                human assessors will do
                            </li>
                            <li>
                                Remember that LLMs cannot tell good from bad
                                design and cannot "understand" your rationale,
                                it only seems like they do because the can
                                respond eloquently in your own language
                            </li>
                            <li>
                                LLMs can not reason (
                                <a
                                    target="_blank"
                                    className="text-blue-500 underline"
                                    href="https://arstechnica.com/ai/2024/10/llms-cant-perform-genuine-logical-reasoning-apple-researchers-suggest/"
                                >
                                    source
                                </a>
                                ), and they can also not "see" the images in
                                your portfolio, so their assessment is very
                                partial and might differ from what your human
                                assessors will do
                            </li>
                            <li>
                                This tool is aimed to be a fun experiment on how
                                to use LLMs for this purpose, and as an aid to
                                check as you make progress on your documents for
                                the assessment, we think it can be helpful in
                                making sure that there are no obvious omissions
                                for certain indicators for example.
                            </li>
                            <li>
                                This tool will not upload your assessment
                                documents to any cloud service before running
                                them through an LLM. A local LLM is used via
                                Ollama, so it is safe to use for potentially
                                sensitive intellectual property materials.
                            </li>
                            <li>
                                Your documents are not deleted after the report
                                is given.
                            </li>
                        </ol>
                        <DialogFooter>
                            <Button variant="destructive" onClick={getFeedback}>
                                I have read the disclaimer and understand it,
                                give me feedback now
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex flex-col text-center gap-2">
                    <div className="flex text-muted-foreground gap-1">
                        <span>Concept and design by</span>
                        <ul className="flex gap-1">
                            <li>Jaap Hulst,</li>
                            <li>Niloo Zabardast</li>
                            <li>and Elena Mihai</li>
                        </ul>
                    </div>

                    <a
                        href="https://sanderboer.nl"
                        target="_blank"
                        className="text-muted-foreground text-xs hover:underline"
                    >
                        Made with ♥️ by xiduzo
                    </a>
                </div>
            </aside>
        </>
    );
}

const dropArea = cva(
    "hover:bg-muted/40 hover:border-primary/20 bg-none transition-all max-h-72 min-h-24 h-[25vh] relative border-2 border-dashed rounded-lg flex items-center justify-center",
    {
        variants: {
            active: {
                true: "bg-muted/40 border-primary/20",
            },
        },
    },
);

function FileUploader(props: { file: File; removeFile: (file: File) => void }) {
    const { add } = useDocumentStore();

    const [progress, setProgress] = useState(0);
    const [uploadState, setUploadState] =
        useState<FileUploaderCardProps["uploadState"]>("uploading");

    useInterval(
        () => {
            setProgress((prev) => {
                if (prev >= 100) return 100;
                return Math.min(95, prev + Math.random() * 2);
            });
        },
        uploadState === "uploading" ? 200 : null,
    );

    useEffect(() => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = event.target?.result;
            if (!fileData) {
                toast.warning(props.file.name, {
                    description: "No data found in the file",
                });
                setUploadState("error");
                return;
            }

            window.electron.ipcRenderer.send<IpcPdfParseRequest>(
                IPC_CHANNEL.PDF_PARSE,
                {
                    fileData: fileData as ArrayBuffer,
                    fileName: props.file.name,
                },
            );
        };
        reader.readAsArrayBuffer(props.file);

        return window.electron.ipcRenderer.on<IpcPdfParseResponse>(
            IPC_CHANNEL.PDF_PARSE,
            async (response) => {
                if (!response.success) {
                    toast.warning(props.file.name, {
                        description: response.error,
                    });
                    setUploadState("error");
                    return;
                }

                if (props.file.name !== response.data.fileName) return;

                if (!response.data) {
                    toast.warning(props.file.name, {
                        description: "No data found in the file",
                    });
                    setUploadState("error");
                    return;
                }

                toast.success(props.file.name, {
                    description: "File uploaded successfully",
                });

                setProgress(100);
                setTimeout(() => {
                    setUploadState("success");
                }, 300);
                add({
                    name: props.file.name,
                    lastModified: props.file.lastModified,
                    text: response.data.text,
                });
                await new Promise((resolve) => setTimeout(resolve, 3000));
                props.removeFile(props.file);
            },
        );
    }, [props.file, props.removeFile, add]);

    return (
        <Card className={fileUploaderCard({ uploadState })}>
            <CardHeader className="flex flex-row items-start text-start space-x-6 space-y-0">
                <section className="relative mt-0.5 flex items-center justify-center rounded-full">
                    {uploadState === "uploading" && (
                        <div className="absolute animate-ping bg-foreground/10 w-7 h-7 rounded-full"></div>
                    )}
                    <div className={fileIconBackground({ uploadState })}></div>
                    {uploadState === "uploading" && (
                        <File className="z-10" size={20} />
                    )}
                    {uploadState === "success" && (
                        <FileDigit size={20} className="text-green-900 z-10" />
                    )}
                    {uploadState === "error" && (
                        <FileX2 className="text-red-500 z-10" size={20} />
                    )}
                </section>
                <section className="grow">
                    <h2
                        className={fileStateTextColor({
                            uploadState,
                            className: "font-semibold",
                        })}
                    >
                        {props.file.name}
                    </h2>
                    <div className="text-muted-foreground">
                        {readableByteSize(props.file.size)}
                    </div>
                </section>
                <Button
                    variant="ghost"
                    disabled={uploadState === "success"}
                    size="icon"
                    onClick={() => {
                        props.removeFile(props.file);
                    }}
                >
                    <Trash />
                </Button>
            </CardHeader>
            <CardContent>
                {uploadState !== "success" && <Progress value={progress} />}
                {uploadState === "success" && (
                    <div className="relative h-4 rounded-lg w-full bg-primary overflow-hidden">
                        <FlickeringGrid
                            className="z-0 absolute inset-0 size-full"
                            squareSize={16}
                            gridGap={0}
                            color="#ffffff"
                            maxOpacity={0.1}
                            flickerChance={0.3}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const fileIconBackground = cva(
    "absolute w-10 h-10 rounded-full transition-all",
    {
        variants: {
            uploadState: {
                uploading: "bg-foreground/10 animate-pulse",
                error: "bg-red-500/10",
                success: "bg-green-400/10",
            },
        },
    },
);

const fileStateTextColor = cva("transition-all", {
    variants: {
        uploadState: {
            uploading: "text-primary",
            error: "text-red-500",
            success: "text-green-950",
        },
    },
});

const fileUploaderCard = cva("transtition-all", {
    variants: {
        uploadState: {
            uploading: "bg-background/30",
            error: "bg-red-50/30",
            success: "bg-green-50/30",
        },
    },
});
type FileUploaderCardProps = VariantProps<typeof fileUploaderCard>;

function readableByteSize(size: number) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    while (size > 1024 && unitIndex < units.length) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
