import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table,
  Code,
  Link,
  Image,
  Braces,
  Eye,
  Edit3,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Placeholder {
  key: string;
  label: string;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholders?: Placeholder[];
  onPlaceholdersChange?: (placeholders: Placeholder[]) => void;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholders = [],
  onPlaceholdersChange,
  className = "",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || placeholder;

      const newValue =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);

      onChange(newValue);

      // Set cursor position after insert
      setTimeout(() => {
        textarea.focus();
        const newPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [value, onChange]
  );

  const insertPlaceholder = useCallback(
    (key: string) => {
      insertText(`{{${key}}}`, "", "");
    },
    [insertText]
  );

  const toolbarButtons = [
    { icon: Bold, label: "Negrito", action: () => insertText("**", "**", "texto") },
    { icon: Italic, label: "Itálico", action: () => insertText("*", "*", "texto") },
    { icon: Heading1, label: "Título 1", action: () => insertText("# ", "", "Título") },
    { icon: Heading2, label: "Título 2", action: () => insertText("## ", "", "Título") },
    { icon: Heading3, label: "Título 3", action: () => insertText("### ", "", "Título") },
    { icon: List, label: "Lista", action: () => insertText("- ", "", "item") },
    { icon: ListOrdered, label: "Lista Numerada", action: () => insertText("1. ", "", "item") },
    {
      icon: Table,
      label: "Tabela",
      action: () =>
        insertText(
          "\n| Coluna 1 | Coluna 2 | Coluna 3 |\n|----------|----------|----------|\n| ",
          " | valor | valor |\n",
          "valor"
        ),
    },
    { icon: Code, label: "Código", action: () => insertText("`", "`", "código") },
    { icon: Link, label: "Link", action: () => insertText("[", "](url)", "texto") },
    { icon: Image, label: "Imagem", action: () => insertText("![", "](url)", "descrição") },
  ];

  // Extract placeholders from content
  const extractedPlaceholders = value.match(/\{\{([^}]+)\}\}/g) || [];
  const uniquePlaceholders = [...new Set(extractedPlaceholders.map((p) => p.replace(/\{\{|\}\}/g, "")))];

  // Render markdown preview (basic)
  const renderPreview = () => {
    let html = value
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')
      // Placeholders (highlight them)
      .replace(
        /\{\{([^}]+)\}\}/g,
        '<span class="bg-primary/20 text-primary px-1 rounded border border-primary/30">{{$1}}</span>'
      )
      // Line breaks
      .replace(/\n/g, "<br />");

    return html;
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b bg-muted/50 px-2">
          <div className="flex items-center gap-1 py-1 overflow-x-auto">
            <TooltipProvider>
              {toolbarButtons.map((button, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={button.action}
                      disabled={activeTab !== "edit"}
                    >
                      <button.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{button.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              <div className="w-px h-6 bg-border mx-1" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1"
                    disabled={activeTab !== "edit"}
                  >
                    <Braces className="h-4 w-4" />
                    <span className="text-xs">Placeholder</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Inserir Placeholder</p>
                    <ScrollArea className="h-48">
                      <div className="space-y-1">
                        {placeholders.length > 0 ? (
                          placeholders.map((p) => (
                            <Button
                              key={p.key}
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-left h-auto py-1.5"
                              onClick={() => insertPlaceholder(p.key)}
                            >
                              <div>
                                <div className="font-mono text-xs text-primary">
                                  {`{{${p.key}}}`}
                                </div>
                                <div className="text-xs text-muted-foreground">{p.label}</div>
                              </div>
                            </Button>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground p-2">
                            Nenhum placeholder definido. Digite {"{{campo}}"} no editor para criar.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </TooltipProvider>
          </div>

          <TabsList className="h-8">
            <TabsTrigger value="edit" className="text-xs h-7 gap-1">
              <Edit3 className="h-3 w-3" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs h-7 gap-1">
              <Eye className="h-3 w-3" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[400px] border-0 rounded-none focus-visible:ring-0 font-mono text-sm resize-none"
            placeholder="Digite o conteúdo do template em Markdown...

Use {{campo}} para inserir placeholders dinâmicos.
Exemplo: {{sistema.nome}}, {{autor.nome}}, {{documento.data}}"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <ScrollArea className="h-[400px] p-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {uniquePlaceholders.length > 0 && (
        <div className="border-t p-2 bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Placeholders detectados:</span>
            {uniquePlaceholders.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs font-mono">
                {`{{${p}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
