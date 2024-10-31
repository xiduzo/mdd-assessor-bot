import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLlm } from "@/providers/LlmProvider";
import { cva } from "class-variance-authority";
import { Bird, Bot, BotOff, ExternalLink } from "lucide-react";

export function LlmAgentDropdownMenu() {
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
          {status === "initialized" && <Bot />}
          {model?.name ?? "No LLM selected"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" align="end">
        <DropdownMenuItem
          onClick={() => window.open("https://ollama.com/library")}
        >
          <Bird />
          Install models
          <DropdownMenuShortcut>
            <ExternalLink className="text-muted-foreground" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Select feedback LLM</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {!models.length && (
                <DropdownMenuItem disabled>
                  No models available on your device
                </DropdownMenuItem>
              )}
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
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
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
