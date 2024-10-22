import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useLlm } from "@/providers/LlmProvider";
import { File, Trash, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const uploadFileHint = "Upload a PDF file to see your results";
const fileStates = [
  "Uploading your masterpiece",
  "Sending your PDF on a digital adventure",
  "Finding competencies and indicators to grade",
  "Turning your PDF into digital gold",
  "Notifying the right authorities",
  "Extracing all of your wisdoms",
  "PDF is putting on its best suit",
  "Extraxting every single byte for information",
  "Just a moment, we're preparing the magic...",
];

export function HomeRoute() {
  const navigate = useNavigate();
  const { addStudentDocuments } = useLlm();
  const [hint, setHint] = useState(uploadFileHint);
  const [file, setFile] = useState<File>();
  const [active, setActive] = useState(false);
  const [fileState, setFileState] = useState(
    fileStates[Math.floor(Math.random() * fileStates.length)],
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const fileData = event.target?.result;
      window.electron.ipcRenderer.send("pdf-parse", fileData, file.name);
    };
    reader.readAsArrayBuffer(file);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          return 100;
        }

        if (prev % 10 === 0 && Math.random() > 0.5) {
          setFileState(
            fileStates[Math.floor(Math.random() * fileStates.length)],
          );
        }

        return prev + 1;
      });
    }, 100);

    window.electron.ipcRenderer.on(
      "upload-file-response",
      async (data: { success: boolean; data?: string; error?: string }) => {
        if (!data.success || data.error) {
          toast.warning(
            data.error || "An error occurred while processing your file",
          );
          clearInterval(interval);
          setFile(undefined);
          return;
        }

        if (!data.data) {
          toast.warning("No data found in the file");
          clearInterval(interval);
          setFile(undefined);
          return;
        }

        toast.success("File processed successfully");
        clearInterval(interval);
        setProgress(100);
        await addStudentDocuments([{ fileName: file.name, data: data.data }]);
        navigate("/result", {
          replace: true,
        });
      },
    );

    return () => clearInterval(interval);
  }, [file, addStudentDocuments, navigate]);

  return (
    <main className="p-12 min-h-lvh text-center flex flex-col space-y-12">
      <header className="flex flex-col items-center mt-12">
        <div className="w-40 h-40 rounded-full bg-purple-400 animate-pulse mb-8"></div>
        <h1 className="font-semibold text-4xl">
          Let's review your portfolio 👀
        </h1>
      </header>
      <section className="grow">
        {!file && (
          <section
            className={`hover:bg-primary/5 transition-all max-h-72 min-h-36 h-[30vh] relative border-2 max-w-6xl mx-auto border-dashed border-primary rounded-lg flex items-center justify-center ${active ? "bg-primary/5" : ""}`}
          >
            <Label
              htmlFor="file"
              className="flex flex-col items-center justify-end space-y-2"
            >
              <UploadCloud className="bg-muted rounded-full w-12 h-12 p-3" />
              <div>
                <span>Click to upload</span> or drag and drop
              </div>
              <div>PDF (max. 1 GB)</div>
            </Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              className="absolute inset-0 h-full cursor-pointer opacity-0"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                if (file.type !== "application/pdf") {
                  toast.warning("Please upload a PDF file");
                  setHint(uploadFileHint);
                  setActive(false);
                  return;
                }
                const GIGABYTE = 1024 * 1024 * 1024;
                if (file.size > GIGABYTE) {
                  toast.warning("Your file is too large, max 1 GB");
                  setHint(uploadFileHint);
                  setActive(false);
                  return;
                }

                setFile(file);
                setHint("Processing file...");
              }}
              onDragEnter={() => {
                setHint("Drop it like it's hot!");
                setActive(true);
              }}
              onDragLeave={() => {
                setHint(uploadFileHint);
                setActive(false);
              }}
            />
          </section>
        )}
        {file && (
          <Card>
            <CardHeader className="flex flex-row items-start text-start space-x-6">
              <section className="relative mt-2 flex items-center justify-center rounded-full">
                <div className="absolute animate-ping bg-primary/20 w-7 h-7 rounded-full"></div>
                <div className="absolute animate-pulse bg-primary/10 w-10 h-10 rounded-full"></div>
                <File className="z-10" size={20} />
              </section>
              <section className="grow">
                <h2 className="font-semibold">{file.name}</h2>
                <div className="text-muted-foreground">
                  {fileSizeToReadable(file.size)}
                </div>
              </section>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFile(undefined);
                  setHint(uploadFileHint);
                }}
              >
                <Trash />
              </Button>
            </CardHeader>
            <CardContent>
              <Progress value={progress} />
            </CardContent>
            <CardFooter className="animate-pulse">{fileState}</CardFooter>
          </Card>
        )}
      </section>
      <div className="text-muted-foreground">{hint}</div>
    </main>
  );
}

function fileSizeToReadable(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  while (size > 1024 && unitIndex < units.length) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
