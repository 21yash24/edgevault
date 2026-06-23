"use client";

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, Quote, Heading1, Heading2, 
  Code, Minus, Undo, Redo, Type, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// Custom Rich Text Editor — zero external dependencies
// Uses contentEditable + execCommand for formatting
// Beautiful floating toolbar with dark fintech styling
// ═══════════════════════════════════════════════════════════

interface ToolbarButton {
  icon: React.ReactNode;
  command: string;
  arg?: string;
  label: string;
  isBlock?: boolean;
  isFileInput?: boolean;
}

const TOOLBAR_BUTTONS: ToolbarButton[][] = [
  [
    { icon: <Undo size={14} />, command: "undo", label: "Undo" },
    { icon: <Redo size={14} />, command: "redo", label: "Redo" },
  ],
  [
    { icon: <Heading1 size={14} />, command: "formatBlock", arg: "h2", label: "Heading 1", isBlock: true },
    { icon: <Heading2 size={14} />, command: "formatBlock", arg: "h3", label: "Heading 2", isBlock: true },
    { icon: <Type size={14} />, command: "formatBlock", arg: "p", label: "Paragraph", isBlock: true },
  ],
  [
    { icon: <Bold size={14} />, command: "bold", label: "Bold" },
    { icon: <Italic size={14} />, command: "italic", label: "Italic" },
    { icon: <Underline size={14} />, command: "underline", label: "Underline" },
    { icon: <Strikethrough size={14} />, command: "strikeThrough", label: "Strikethrough" },
  ],
  [
    { icon: <List size={14} />, command: "insertUnorderedList", label: "Bullet List" },
    { icon: <ListOrdered size={14} />, command: "insertOrderedList", label: "Numbered List" },
    { icon: <Quote size={14} />, command: "formatBlock", arg: "blockquote", label: "Quote", isBlock: true },
    { icon: <Code size={14} />, command: "formatBlock", arg: "pre", label: "Code Block", isBlock: true },
  ],
  [
    { icon: <Minus size={14} />, command: "insertHorizontalRule", label: "Divider" },
    { icon: <ImageIcon size={14} />, command: "insertImage", label: "Insert Image", isFileInput: true },
  ],
];

interface RichCanvasProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  theme?: "snow" | "bubble"; // kept for API compat, both work the same
  minHeight?: string;
}

export const RichCanvas = forwardRef<any, RichCanvasProps>(
  ({ value, onChange, placeholder = "Start writing...", className, minHeight = "150px" }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const isInternalChange = useRef(false);

    // Sync value from outside into the editor
    useEffect(() => {
      if (!editorRef.current || isInternalChange.current) {
        isInternalChange.current = false;
        return;
      }
      // Only update if the external value actually differs from what's in the editor
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
      setIsEmpty(!value || value === "<br>" || value.replace(/<[^>]*>/g, "").trim() === "");
    }, [value]);

    const handleInput = useCallback(() => {
      if (!editorRef.current) return;
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || "";
      setIsEmpty(textContent.trim() === "" && !html.includes("<img"));
      onChange(html);
    }, [onChange]);

    const execCmd = useCallback((command: string, arg?: string) => {
      // Restore focus to the editor before executing the command
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      handleInput();
    }, [handleInput]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "b": e.preventDefault(); execCmd("bold"); break;
          case "i": e.preventDefault(); execCmd("italic"); break;
          case "u": e.preventDefault(); execCmd("underline"); break;
          case "z":
            e.preventDefault();
            execCmd(e.shiftKey ? "redo" : "undo");
            break;
        }
      }

      // Tab to indent in lists
      if (e.key === "Tab") {
        e.preventDefault();
        execCmd(e.shiftKey ? "outdent" : "indent");
      }
    }, [execCmd]);

    // Handle paste: clean up formatting
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }, []);

    return (
      <div className={cn("relative w-full group/editor", className)}>
        {/* Toolbar */}
        <div className={cn(
          "flex flex-wrap items-center gap-0.5 p-1.5 rounded-t-xl border border-b-0 transition-all duration-300",
          "bg-bg-card/80 backdrop-blur-md border-border-subtle",
          isFocused && "border-accent-violet/30 bg-bg-card"
        )}>
          {TOOLBAR_BUTTONS.map((group, gi) => (
            <div key={gi} className="flex items-center">
              {gi > 0 && <div className="w-px h-5 bg-border-subtle/50 mx-1" />}
              {group.map((btn) => (
                btn.isFileInput ? (
                  <label
                    key="insert-image"
                    title={btn.label}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-md text-text-muted cursor-pointer",
                      "hover:bg-accent-violet/10 hover:text-accent-violet",
                      "active:scale-90 transition-all duration-150"
                    )}
                  >
                    {btn.icon}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            editorRef.current?.focus();
                            document.execCommand('insertImage', false, ev.target.result as string);
                            handleInput();
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }} 
                    />
                  </label>
                ) : (
                  <button
                    key={btn.command + (btn.arg || "")}
                    type="button"
                    title={btn.label}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur
                      execCmd(btn.command, btn.arg);
                    }}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-md text-text-muted",
                      "hover:bg-accent-violet/10 hover:text-accent-violet",
                      "active:scale-90 transition-all duration-150"
                    )}
                  >
                    {btn.icon}
                  </button>
                )
              ))}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={cn(
              "w-full outline-none px-4 py-3 rounded-b-xl border transition-all duration-300",
              "bg-bg-card/30 border-border-subtle text-text-primary text-sm leading-relaxed",
              "selection:bg-accent-violet/20 selection:text-text-primary",
              // Rich text element styles via Tailwind arbitrary selectors
              "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-text-primary",
              "[&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-text-primary",
              "[&_p]:mb-2 [&_p]:leading-relaxed",
              "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ul]:space-y-0.5",
              "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_ol]:space-y-0.5",
              "[&_li]:text-text-secondary",
              "[&_blockquote]:border-l-2 [&_blockquote]:border-accent-violet/40 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:bg-accent-violet/5 [&_blockquote]:rounded-r-lg [&_blockquote]:my-2",
              "[&_pre]:bg-bg-base [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-xs [&_pre]:font-[family-name:var(--font-space-mono)] [&_pre]:text-accent-green [&_pre]:border [&_pre]:border-border-subtle [&_pre]:my-2 [&_pre]:overflow-x-auto",
              "[&_hr]:border-border-subtle [&_hr]:my-4",
              "[&_strong]:text-text-primary [&_strong]:font-bold",
              "[&_em]:text-text-secondary",
              "[&_u]:decoration-accent-violet/50",
              "[&_s]:text-text-muted",
              "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:shadow-md [&_img]:border [&_img]:border-border-subtle [&_img]:my-4",
              isFocused && "border-accent-violet/30 shadow-[0_0_20px_rgba(123,97,255,0.05)]",
            )}
            style={{ minHeight }}
          />
          
          {/* Placeholder */}
          {isEmpty && !isFocused && (
            <div 
              className="absolute top-3 left-4 text-sm text-text-muted/40 pointer-events-none select-none"
              aria-hidden
            >
              {placeholder}
            </div>
          )}
        </div>
      </div>
    );
  }
);

RichCanvas.displayName = "RichCanvas";
