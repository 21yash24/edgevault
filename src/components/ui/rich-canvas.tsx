"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { Camera, Image as ImageIcon, Link as LinkIcon, Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";

interface RichCanvasProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  theme?: "snow" | "bubble";
  minHeight?: string;
}

export const RichCanvas = forwardRef<any, RichCanvasProps>(
  ({ value, onChange, placeholder = "Start writing...", className, theme = "snow", minHeight = "150px" }, ref) => {
    const quillRef = useRef<any>(null);

    // Provide access to the quill instance if needed
    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current?.getEditor(),
    }));

    const modules = {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link', 'image'],
        ['clean']
      ],
    };

    const formats = [
      'header',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet',
      'link', 'image'
    ];

    return (
      <div className={cn("relative w-full z-0 group", className)}>
        <ReactQuill 
          ref={quillRef}
          theme={theme}
          value={value || ""}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent", 
            "[&_.ql-toolbar]:bg-neutral-900/50 [&_.ql-toolbar]:border-neutral-800 [&_.ql-toolbar]:rounded-t-lg",
            "[&_.ql-container]:border-neutral-800 [&_.ql-container]:rounded-b-lg [&_.ql-container]:bg-neutral-900/30",
            "[&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-neutral-200",
            "[&_.ql-editor.ql-blank::before]:text-neutral-600",
            "[&_.ql-stroke]:stroke-neutral-400 [&_.ql-fill]:fill-neutral-400 [&_.ql-picker]:text-neutral-400"
          )}
          style={{ minHeight }}
        />
      </div>
    );
  }
);

RichCanvas.displayName = "RichCanvas";
