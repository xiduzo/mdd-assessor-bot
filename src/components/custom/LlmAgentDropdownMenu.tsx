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
import { useLlmStore } from "@/stores/llmStore";
import { cva } from "class-variance-authority";
import { Bird, Bot, BotOff, ExternalLink } from "lucide-react";

export function LlmAgentDropdownMenu() {
    const { model, models, select } = useLlmStore();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={llmAgentButton()}
                    aria-label="Select your LLM assessor"
                >
                    {(!models || !model) && <BotOff />}
                    {model && <Bot />}
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
                    <DropdownMenuSubTrigger>
                        Select feedback LLM
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {!models.length && (
                                <DropdownMenuItem disabled>
                                    No models available on your device
                                </DropdownMenuItem>
                            )}
                            {models.map((_model) => (
                                <DropdownMenuCheckboxItem
                                    key={_model.name}
                                    checked={_model.name === model?.name}
                                    disabled={_model.name === model?.name}
                                    onClick={() => select(_model)}
                                >
                                    {_model.name}
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
