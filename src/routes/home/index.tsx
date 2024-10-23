import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useLlm } from "@/providers/LlmProvider";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cva, VariantProps } from "class-variance-authority";
import {
  File,
  FileCheck,
  FileQuestion,
  Trash,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useInterval } from "usehooks-ts";

const MEGA_BYTE = 1024 * 1024;
const MAX_FILE_SIZE_IN_MB = 50;
const MAX_FILE_SIZE = MEGA_BYTE * MAX_FILE_SIZE_IN_MB;

export function HomeRoute() {
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
    <article className="text-center flex flex-col space-y-6 h-[85vh]">
      <header className="flex flex-col items-center mt-0">
        <div className="w-40 h-40 rounded-full bg-purple-400 animate-pulse mb-4"></div>
        <h1 className="font-semibold text-4xl">
          Let's review your documents 👀
        </h1>
      </header>
      <section className="grow space-y-4">
        {!files.length && (
          <section
            className={`hover:bg-primary/5 transition-all max-h-72 min-h-24 h-[25vh] relative border-2 max-w-6xl mx-auto border-dashed border-primary rounded-lg flex items-center justify-center ${active ? "bg-primary/5" : ""}`}
          >
            <Label
              htmlFor="file"
              className="flex flex-col items-center justify-end space-y-2"
            >
              <UploadCloud className="bg-muted rounded-full w-12 h-12 p-3" />
              <div>
                <span className="font-bold">Click to upload</span> or drag and
                drop
              </div>
              <div className="text-muted-foreground">
                PDF (max. {MAX_FILE_SIZE_IN_MB} MB)
              </div>
            </Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              multiple
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
        <section className="space-y-2" ref={autoAnimateRef}>
          {files.map((file) => (
            <FileUploader key={file.name} file={file} removeFile={removeFile} />
          ))}
        </section>
        {active && (
          <div className="text-muted-foreground">Drop it like its hot</div>
        )}
      </section>
      <section>
        <Button
          disabled={!documents.length || status !== "initialized"}
          onClick={() => {
            clearFeedback();
            navigate("/result");
          }}
        >
          {!documents.length && "Upload documents to start analyzing"}
          {!!documents.length && "Start analyzing"}
        </Button>
      </section>
    </article>
  );
}

function FileUploader(props: { file: File; removeFile: (file: File) => void }) {
  const { addStudentDocuments } = useLlm();

  const [progress, setProgress] = useState(0);
  const [uploadState, setUploadState] =
    useState<FileUploaderCardProps["uploadState"]>("uploading");

  useInterval(
    () => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }

        return Math.max(95, prev + Math.random() * 3);
      });
    },
    uploadState === "uploading" ? 300 : null,
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
        setUploadState("success");
        await addStudentDocuments([
          {
            name: props.file.name,
            lastModified: props.file.lastModified,
            text: response.data ?? "",
          },
        ]);
        props.removeFile(props.file);
      },
    );
  }, [props.file, props.removeFile]);

  return (
    <Card className={fileUploaderCard({ uploadState: uploadState })}>
      <CardHeader className="flex flex-row items-start text-start space-x-6 space-y-0">
        <section className="relative mt-0.5 flex items-center justify-center rounded-full">
          {uploadState === "uploading" && (
            <div className="absolute animate-ping bg-primary/20 w-7 h-7 rounded-full"></div>
          )}
          {uploadState === "uploading" && (
            <div className="absolute animate-pulse bg-primary/10 w-10 h-10 rounded-full"></div>
          )}
          {uploadState === "uploading" && <File className="z-10" size={20} />}
          {uploadState === "success" && (
            <FileCheck className="text-green-500" size={20} />
          )}
          {uploadState === "error" && (
            <FileQuestion className="text-red-500" size={20} />
          )}
        </section>
        <section className="grow">
          <h2
            className={fileStateTextColor({
              uploadState: uploadState,
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
        <Progress value={progress} />
      </CardContent>
      {/* <CardFooter className="animate-pulse">"filestate"</CardFooter> */}
    </Card>
  );
}

const fileStateTextColor = cva("", {
  variants: {
    uploadState: {
      uploading: "text-primary",
      error: "text-red-500",
      success: "text-green-500",
    },
  },
});

const fileUploaderCard = cva("transtition-all duration-300", {
  variants: {
    uploadState: {
      uploading: "",
      error: "bg-red-50",
      success: "bg-green-50",
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
