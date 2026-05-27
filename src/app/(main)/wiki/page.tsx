"use client";

import { useWikiStore, WikiNote, WikiFolder, WikiTag } from "@/stores";
import { 
  BookOpen, Calendar, Flame, Plus, Search, Tag as TagIcon, 
  Folder, Clock, FileText, ChevronRight, Save, Trash2, 
  MoreVertical, Edit3, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type SidebarView = { type: "folder", id: string } | { type: "tag", id: string };

export default function WikiPage() {
  const { folders, tags, notes, templates, saveNote, deleteNote, addFolder, addTag } = useWikiStore();
  
  const [activeView, setActiveView] = useState<SidebarView>({ type: "folder", id: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Derived filtered notes
  const filteredNotes = useMemo(() => {
    let result = Object.values(notes).map((n: any) => {
      let migratedContent = n.content || "";
      if (!n.content && (n.preMarketPlan || n.postMarketReview || n.intradayNotes)) {
        migratedContent += (n.preMarketPlan ? `<h2>Pre-Market Plan</h2><p>${n.preMarketPlan}</p><br/>` : "");
        migratedContent += (n.intradayNotes ? `<h2>Intraday Notes</h2><p>${n.intradayNotes}</p><br/>` : "");
        migratedContent += (n.postMarketReview ? `<h2>Post-Market Review</h2><p>${n.postMarketReview}</p>` : "");
      }
      return {
        ...n,
        id: n.id || `note-${n.date || Date.now()}`,
        tags: n.tags || [],
        title: n.title || (n.date ? `Journal: ${n.date}` : "Untitled Note"),
        content: migratedContent,
        updatedAt: n.updatedAt || Date.now(),
        folderId: n.folderId || "f-journal",
      };
    });
    
    // Apply View Filter
    if (activeView.type === "folder" && activeView.id !== "all") {
      result = result.filter(n => n.folderId === activeView.id);
    } else if (activeView.type === "tag") {
      result = result.filter(n => n.tags.includes(activeView.id));
    }

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }

    // Sort by updated descending
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, activeView, searchQuery]);

  // Create new note
  const handleCreateNote = () => {
    let folderId = activeView.type === "folder" && activeView.id !== "all" ? activeView.id : folders[0]?.id || "f-journal";
    const folder = folders.find(f => f.id === folderId);
    const template = templates.find(t => t.id === folder?.defaultTemplateId);
    
    const newNote: WikiNote = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      content: template ? template.content : "",
      folderId,
      tags: [],
      date: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    saveNote(newNote);
    setActiveNoteId(newNote.id);
  };

  const formatNoteTime = (ts: number) => {
    const d = new Date(ts);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d");
  };

  const getFolderIcon = (iconName?: string) => {
    switch(iconName) {
      case "BookOpen": return <BookOpen size={16} />;
      case "Calendar": return <Calendar size={16} />;
      case "Flame": return <Flame size={16} />;
      default: return <Folder size={16} />;
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col sm:flex-row bg-bg-base border border-border-subtle rounded-2xl overflow-hidden shadow-2xl">
      
      {/* 1. LEFT SIDEBAR: Navigation */}
      <div className="w-full sm:w-64 bg-bg-card border-r border-border-subtle flex flex-col">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="font-[family-name:var(--font-inter)] font-black text-lg text-text-primary">Wiki / Notes</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Folders */}
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-2">Folders</div>
            <button
              onClick={() => setActiveView({ type: "folder", id: "all" })}
              className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                activeView.type === "folder" && activeView.id === "all" ? "bg-accent-violet/10 text-accent-violet" : "text-text-secondary hover:bg-border-subtle/30"
              )}
            >
              <FileText size={16} /> All Notes
            </button>
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveView({ type: "folder", id: f.id })}
                className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  activeView.type === "folder" && activeView.id === f.id ? "bg-accent-violet/10 text-accent-violet" : "text-text-secondary hover:bg-border-subtle/30"
                )}
              >
                {getFolderIcon(f.icon)} {f.name}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-2 flex justify-between items-center">
              Tags
            </div>
            {tags.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveView({ type: "tag", id: t.id })}
                className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  activeView.type === "tag" && activeView.id === t.id ? "bg-bg-secondary text-text-primary" : "text-text-secondary hover:bg-border-subtle/30"
                )}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE PANEL: Note List */}
      <div className="w-full sm:w-80 bg-bg-base border-r border-border-subtle flex flex-col">
        <div className="p-4 border-b border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-text-primary">
              {activeView.type === "folder" 
                ? (activeView.id === "all" ? "All Notes" : folders.find(f => f.id === activeView.id)?.name)
                : `Tag: ${tags.find(t => t.id === activeView.id)?.name}`
              }
            </h3>
            <button onClick={handleCreateNote} className="p-1.5 rounded-lg bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20 transition-all">
              <Plus size={16} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-card border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent-violet/40 transition-all placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-border-subtle flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">No notes found</p>
              <p className="text-xs text-text-muted">Create a new note to get started.</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={cn("w-full text-left p-3 rounded-xl transition-all border",
                  activeNoteId === note.id 
                    ? "bg-bg-card border-accent-violet/20 shadow-sm" 
                    : "bg-transparent border-transparent hover:bg-border-subtle/20"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold text-sm text-text-primary truncate pr-2">{note.title || "Untitled"}</div>
                  <div className="text-[10px] text-text-muted whitespace-nowrap pt-0.5">{formatNoteTime(note.updatedAt)}</div>
                </div>
                <div className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {note.content || "No content..."}
                </div>
                {note.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {note.tags.map((tId: string) => {
                      const tag = tags.find(t => t.id === tId);
                      return tag ? (
                        <div key={tId} className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} title={tag.name} />
                      ) : null;
                    })}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 3. RIGHT PANEL: Rich Text Editor */}
      <div className="flex-1 bg-bg-base flex flex-col overflow-hidden relative">
        {activeNoteId ? (
          <NoteEditor 
            noteId={activeNoteId} 
            key={activeNoteId} // Force remount on note change
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted space-y-4">
            <BookOpen size={48} className="opacity-20" />
            <p className="font-medium">Select a note or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Note Editor Subcomponent
// ----------------------------------------------------------------------
function NoteEditor({ noteId }: { noteId: string }) {
  const { notes, saveNote, deleteNote, folders, tags } = useWikiStore();
  const note = notes[noteId];
  
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [selectedFolder, setSelectedFolder] = useState(note?.folderId || "f-journal");
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save logic
  useEffect(() => {
    if (!note) return;
    const timeout = setTimeout(() => {
      if (title !== note.title || content !== note.content || selectedFolder !== note.folderId) {
        setIsSaving(true);
        saveNote({
          ...note,
          title,
          content,
          folderId: selectedFolder,
          updatedAt: Date.now()
        });
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [title, content, selectedFolder, note, saveNote]);

  if (!note) return null;

  const currentFolder = folders.find(f => f.id === selectedFolder);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Editor Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-4">
          <select 
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="text-xs font-semibold bg-bg-card border border-border-subtle rounded-lg px-2 py-1 text-text-secondary focus:outline-none"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <Clock size={12} /> Last edited {format(note.updatedAt, "h:mm a")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-xs text-text-muted flex items-center gap-1.5"><Save size={12} className="animate-pulse" /> Saving...</span>
          ) : (
            <span className="text-xs text-accent-green flex items-center gap-1.5"><Save size={12} /> Saved</span>
          )}
          <div className="w-px h-4 bg-border-subtle mx-2" />
          <button 
            onClick={() => {
              if (confirm("Delete this note permanently?")) {
                deleteNote(noteId);
              }
            }}
            className="p-1.5 rounded-lg text-text-muted hover:bg-accent-coral/10 hover:text-accent-coral transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto px-10 py-10 w-full max-w-4xl mx-auto">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full text-4xl font-[family-name:var(--font-inter)] font-black bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted/30 mb-8"
        />
        <style jsx global>{`
          .notebook-quill .ql-toolbar {
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0;
            padding: 8px 0;
            margin-bottom: 20px;
          }
          .notebook-quill .ql-container {
            border: none;
            font-family: var(--font-inter);
            font-size: 16px;
            color: rgba(255, 255, 255, 0.8);
          }
          .notebook-quill .ql-editor {
            padding: 0;
            min-height: 500px;
          }
          .notebook-quill .ql-editor.ql-blank::before {
            left: 0;
            font-style: normal;
            color: rgba(255, 255, 255, 0.3);
          }
          .notebook-quill .ql-stroke {
            stroke: rgba(255, 255, 255, 0.6) !important;
          }
          .notebook-quill .ql-fill {
            fill: rgba(255, 255, 255, 0.6) !important;
          }
          .notebook-quill .ql-picker-label {
            color: rgba(255, 255, 255, 0.6) !important;
          }
        `}</style>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="Start typing your notes here..."
          className="w-full notebook-quill"
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link', 'image'],
              ['clean']
            ],
          }}
        />
      </div>
    </div>
  );
}
