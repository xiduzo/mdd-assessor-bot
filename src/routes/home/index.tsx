import { ParrotHead } from "@/components/custom/ParrotHead";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import FlickeringGrid from "@/components/ui/flickering-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCelebration } from "@/providers/CelebrationProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useLlm } from "@/providers/LlmProvider";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cva, VariantProps } from "class-variance-authority";
import {
  File,
  FileDigit,
  FilePlus,
  FileQuestion,
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

  const { documents, status } = useLlm();
  const { clearFeedback } = useFeedback();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [active, setActive] = useState(false);
  const [autoAnimateRef] = useAutoAnimate();

  const removeFile = useCallback(({ name }: File) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
  }, []);

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
            <FileUploader key={file.name} file={file} removeFile={removeFile} />
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
                    <span className="font-bold">Click to upload</span> or drag
                    and drop
                  </div>
                  <em className="inline-block text-muted-foreground">
                    <code>.pdf</code> files, max. {MAX_FILE_SIZE_IN_MB} MB per
                    file
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

                  const newFiles = Array.from(event.target.files).filter(
                    (file) => {
                      if (file.type !== "application/pdf") {
                        toast.warning(file.name, {
                          description: "Only PDF files are allowed",
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
                    },
                  );

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
            <div className="text-muted-foreground">Drop it like its 🔥</div>
          )}
        </section>
      </article>
      <aside className="flex flex-col items-center space-y-10 left-0 absolute w-full bottom-4">
        <Button
          disabled={
            !documents.length || status !== "initialized" || !!files.length
          }
          onClick={() => {
            if (isFistTimeFeedback) {
              setIsFirstTimeFeedback(false);
              celebrate("That's the spirit, you'll be going places!");
            }
            clearFeedback();
            navigate("/result");
          }}
        >
          {!documents.length && "Upload documents to receive feedback"}
          {!!documents.length && <Sparkles aria-hidden />}
          {!!documents.length && "I want feedback"}
        </Button>
        <a
          href="https://sanderboer.nl"
          target="_blank"
          className="text-muted-foreground text-xs hover:underline"
        >
          Made with ♥️ by xiduzo
        </a>
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
  const { addStudentDocuments } = useLlm();

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
      window.electron.ipcRenderer.send("pdf-parse", fileData, props.file.name);
    };
    reader.readAsArrayBuffer(props.file);

    window.electron.ipcRenderer.on(
      "upload-file-response",
      async (response: {
        success: boolean;
        data?: string;
        error?: string;
        fileName: string;
      }) => {
        if (props.file.name !== response.fileName) return;

        if (!response.success || response.error) {
          toast.warning(props.file.name, {
            description:
              response.error ?? "An error occurred while processing the file",
          });
          setUploadState("error");
          return;
        }

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
        await addStudentDocuments([
          {
            name: props.file.name,
            lastModified: props.file.lastModified,
            text: response.data ?? "",
          },
        ]);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        props.removeFile(props.file);
      },
    );
  }, [props.file, props.removeFile]);

  return (
    <Card className={fileUploaderCard({ uploadState })}>
      <CardHeader className="flex flex-row items-start text-start space-x-6 space-y-0">
        <section className="relative mt-0.5 flex items-center justify-center rounded-full">
          {uploadState === "uploading" && (
            <div className="absolute animate-ping bg-foreground/10 w-7 h-7 rounded-full"></div>
          )}
          <div className={fileIconBackground({ uploadState })}></div>
          {uploadState === "uploading" && <File className="z-10" size={20} />}
          {uploadState === "success" && (
            <FileDigit size={20} className="text-green-900 z-10" />
          )}
          {uploadState === "error" && (
            <FileQuestion className="text-red-500 z-10" size={20} />
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
        error: "bg-red-500",
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
