"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo, useRef, useEffect } from "react";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder = "Start typing..." }: RichEditorProps) {
  const { theme } = useTheme();

  // TradeZella style comprehensive toolbar
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
  }), []);

  return (
    <div className={`rich-editor-wrapper ${theme === "dark" ? "dark-theme" : "light-theme"}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="h-full flex flex-col"
      />
      <style jsx global>{`
        .rich-editor-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .rich-editor-wrapper .quill {
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(15, 20, 30, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .rich-editor-wrapper .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          background: rgba(0, 0, 0, 0.2);
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          padding: 12px !important;
        }

        .rich-editor-wrapper .ql-container {
          border: none !important;
          flex-grow: 1;
          font-family: var(--font-inter), sans-serif;
          font-size: 15px;
          color: var(--text-primary, #fff);
          overflow-y: auto;
        }

        .rich-editor-wrapper .ql-editor {
          padding: 24px;
        }

        /* Light theme overrides */
        .light-theme .quill {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .light-theme .ql-toolbar {
          background: rgba(250, 250, 250, 1);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
        }
        .light-theme .ql-container {
          color: #111;
        }
        .light-theme .ql-picker {
          color: #333;
        }
        .light-theme .ql-stroke {
          stroke: #333;
        }
        .light-theme .ql-fill {
          fill: #333;
        }

        /* Dark theme SVG icon fixes */
        .dark-theme .ql-snow .ql-picker {
          color: #a0aec0;
        }
        .dark-theme .ql-snow .ql-stroke {
          stroke: #a0aec0;
        }
        .dark-theme .ql-snow .ql-fill {
          fill: #a0aec0;
        }
        .dark-theme .ql-snow .ql-picker-options {
          background-color: #1a202c;
          border-color: rgba(255,255,255,0.1);
        }

        /* Editor specific typography */
        .ql-editor h1, .ql-editor h2, .ql-editor h3 {
          font-weight: 900;
          margin-bottom: 0.5em;
          color: inherit;
        }
        
        .ql-editor img {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 100%;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
}
