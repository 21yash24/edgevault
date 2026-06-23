"use client";

import { useNotebookStore, NotebookCategory, NotebookEntry } from "@/stores";
import { RichCanvas } from "@/components/ui/rich-canvas";
import { 
  BookOpen, Calendar, FileText, Star, Plus, Trash2, Menu, X, Share
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";

const CATEGORIES: { id: NotebookCategory; label: string; icon: any }[] = [
  { id: "All Notes", label: "All Notes", icon: BookOpen },
  { id: "Favorites", label: "Favorites", icon: Star },
  { id: "Trade Notes", label: "Trade Notes", icon: FileText },
  { id: "Daily Journal", label: "Daily Journal", icon: Calendar },
  { id: "Sessions Recap", label: "Sessions Recap", icon: BookOpen }
];

export default function NotebookPage() {
  const { entries = {}, saveEntry, deleteEntry, toggleFavorite, templates } = useNotebookStore();
  const [activeCategory, setActiveCategory] = useState<NotebookCategory>("All Notes");
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Derive filtered entries
  const filteredEntries = useMemo(() => {
    let list = Object.values(entries || {});
    if (activeCategory === "Favorites") {
      list = list.filter(e => e.isFavorite);
    } else if (activeCategory !== "All Notes") {
      list = list.filter(e => e.category === activeCategory);
    }
    // Sort descending by created/updated
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entries, activeCategory]);

  // Set first entry as active if none selected
  useEffect(() => {
    if (!activeEntryId && filteredEntries.length > 0) {
      setActiveEntryId(filteredEntries[0].id);
    }
  }, [activeCategory, activeEntryId, filteredEntries]);

  const activeEntry = activeEntryId ? entries[activeEntryId] : null;

  const handleCreateNew = () => {
    const isDaily = activeCategory === "Daily Journal";
    const tmpl = templates.find(t => t.id === "tmpl-daily");
    const newEntry: NotebookEntry = {
      id: `doc-${Date.now()}`,
      title: isDaily ? format(new Date(), "MMM d, yyyy - Daily Journal") : "Untitled Note",
      content: isDaily && tmpl ? tmpl.content : "",
      category: activeCategory === "Favorites" || activeCategory === "All Notes" ? "Trade Notes" : activeCategory,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveEntry(newEntry);
    setActiveEntryId(newEntry.id);
  };

  const handleUpdateActive = (updates: Partial<NotebookEntry>) => {
    if (activeEntry) {
      saveEntry({ ...activeEntry, ...updates });
    }
  };

  const handleDeleteActive = () => {
    if (activeEntryId) {
      deleteEntry(activeEntryId);
      setActiveEntryId(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-bg-base border border-border-subtle rounded-2xl overflow-hidden shadow-lg relative">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-bg-card rounded-lg border border-border-subtle text-text-primary"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Left Sidebar - Categories & List */}
      <div className={cn(
        "w-72 flex-shrink-0 bg-bg-card border-r border-border-subtle flex flex-col transition-all duration-300 absolute md:relative z-40 h-full",
        !isSidebarOpen && "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
      )}>
        {/* Header & Categories */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-text-primary tracking-wide">Notebook</h2>
          </div>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = Object.values(entries || {}).filter(e => cat.id === "All Notes" ? true : cat.id === "Favorites" ? e.isFavorite : e.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setActiveEntryId(null); }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all",
                    isActive ? "bg-accent-violet/10 text-accent-violet" : "text-text-secondary hover:bg-bg-secondary/50 hover:text-text-primary"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? "text-accent-violet" : "opacity-70"} />
                    {cat.label}
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-black bg-bg-secondary px-2 py-0.5 rounded-full text-text-muted">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-black text-text-muted">{activeCategory}</span>
            <button onClick={handleCreateNew} className="text-accent-blue hover:scale-110 transition-transform">
              <Plus size={16} />
            </button>
          </div>
          {filteredEntries.length === 0 ? (
            <div className="text-center p-4 text-text-muted text-xs font-semibold">No notes found.</div>
          ) : (
            filteredEntries.map(entry => (
              <button
                key={entry.id}
                onClick={() => setActiveEntryId(entry.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all border",
                  activeEntryId === entry.id 
                    ? "bg-bg-secondary/40 border-border-subtle shadow-sm" 
                    : "border-transparent hover:bg-bg-secondary/20 hover:border-border-subtle/50"
                )}
              >
                <h4 className="text-sm font-bold text-text-primary truncate">{entry.title || "Untitled"}</h4>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold text-text-muted">
                  <span>{format(new Date(entry.createdAt), "MMM d")}</span>
                  <span className="w-1 h-1 rounded-full bg-border-subtle"></span>
                  <span className="truncate">{entry.content.replace(/<[^>]*>?/gm, '').substring(0, 20)}...</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F19] dark:bg-[#0B0F19]">
        {activeEntry ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-subtle/30 bg-bg-card/20 md:pl-6 pl-16">
              <div className="flex-1 min-w-0 pr-4">
                <input
                  type="text"
                  value={activeEntry.title}
                  onChange={(e) => handleUpdateActive({ title: e.target.value })}
                  placeholder="Note Title"
                  className="w-full bg-transparent border-none text-3xl font-black text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:ring-0 truncate"
                />
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-text-muted">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(activeEntry.createdAt), "MMMM d, yyyy h:mm a")}</span>
                  <span className="px-2 py-0.5 rounded border border-border-subtle bg-bg-secondary/50 uppercase tracking-widest text-[9px]">{activeEntry.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => toggleFavorite(activeEntry.id)}
                  className={cn("p-2.5 rounded-xl border transition-all", activeEntry.isFavorite ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : "bg-bg-card border-border-subtle text-text-muted hover:text-text-primary hover:bg-bg-secondary")}
                >
                  <Star size={16} fill={activeEntry.isFavorite ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={handleDeleteActive}
                  className="p-2.5 rounded-xl border border-border-subtle bg-bg-card text-text-muted hover:text-accent-coral hover:bg-accent-coral/10 hover:border-accent-coral/30 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Rich Editor */}
            <div className="flex-1 min-h-0 relative p-4">
               <RichCanvas 
                  value={activeEntry.content} 
                  onChange={(val) => handleUpdateActive({ content: val })} 
                  placeholder="Press '/' for commands or start typing..."
                  className="h-full"
               />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <BookOpen size={48} className="opacity-20 mb-4" />
            <h3 className="text-lg font-bold text-text-primary">No Note Selected</h3>
            <p className="text-sm">Select a note from the sidebar or create a new one.</p>
            <button 
              onClick={handleCreateNew}
              className="mt-6 px-6 py-2 rounded-xl bg-accent-violet text-white font-bold text-sm shadow-lg shadow-accent-violet/20 hover:scale-105 transition-all"
            >
              Create New Note
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
