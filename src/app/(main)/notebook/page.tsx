"use client";

import { useNotebookStore, useTradeStore } from "@/stores";
import { 
  BookOpen, Calendar, Brain, CheckSquare, Save, ArrowRight, 
  ArrowLeft, TrendingUp, Target, Flame, CloudSun, Moon, Sun, Sunset,
  FileText, Plus, Share, LayoutTemplate, Trash2, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { format, isToday, subDays } from "date-fns";
import html2canvas from "html2canvas";

// ----------------------------------------------------------------------
// Sub-component: The Daily Log View
// ----------------------------------------------------------------------
function DailyLogView() {
  const { notes, saveNote } = useNotebookStore();
  const { trades } = useTradeStore();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [preMarketPlan, setPreMarketPlan] = useState("");
  const [bias, setBias] = useState<any>("");
  const [sleepScore, setSleepScore] = useState<number>(3);
  const [focusScore, setFocusScore] = useState<number>(3);
  const [postMarketReview, setPostMarketReview] = useState("");
  const [intradayNotes, setIntradayNotes] = useState("");
  const [sessionGrade, setSessionGrade] = useState<any>("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const preTextareaRef = useRef<HTMLTextAreaElement>(null);
  const intraTextareaRef = useRef<HTMLTextAreaElement>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeNote = useMemo(() => {
    return notes[selectedDate] || {
      date: selectedDate, preMarketPlan: "", bias: "", sleepScore: 3, focusScore: 3,
      postMarketReview: "", intradayNotes: "", checklistComplete: false, sessionGrade: ""
    };
  }, [notes, selectedDate]);

  useEffect(() => {
    setPreMarketPlan(activeNote.preMarketPlan); setBias(activeNote.bias);
    setSleepScore(activeNote.sleepScore); setFocusScore(activeNote.focusScore);
    setPostMarketReview(activeNote.postMarketReview); setIntradayNotes(activeNote.intradayNotes);
    setSessionGrade(activeNote.sessionGrade);
  }, [activeNote]);

  const handleResize = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  useEffect(() => { handleResize(preTextareaRef); }, [preMarketPlan]);
  useEffect(() => { handleResize(intraTextareaRef); }, [intradayNotes]);
  useEffect(() => { handleResize(postTextareaRef); }, [postMarketReview]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      saveNote(selectedDate, { preMarketPlan, bias, sleepScore, focusScore, postMarketReview, intradayNotes, sessionGrade });
      setIsSaving(false); setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 400);
  };

  const handleExport = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, { backgroundColor: "#0a0a0a", scale: 2 });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `edgevault-daily-${selectedDate}.png`;
      link.click();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const dailyTrades = useMemo(() => trades.filter((t) => t.entryDate?.startsWith(selectedDate)), [trades, selectedDate]);
  const dailyPnL = useMemo(() => dailyTrades.reduce((sum, t) => sum + t.netPnl, 0), [dailyTrades]);

  const changeDate = (days: number) => {
    const parsed = new Date(selectedDate);
    parsed.setDate(parsed.getDate() + days);
    setSelectedDate(parsed.toISOString().split("T")[0]);
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border-subtle/50 pb-6">
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-violet/20 to-accent-blue/10 flex items-center justify-center border border-accent-violet/20">
            <BookOpen size={28} className="text-accent-violet" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-bold text-3xl md:text-4xl text-text-primary tracking-tight">
                {format(new Date(selectedDate), "EEEE, MMMM d")}
              </h1>
              {isToday(new Date(selectedDate)) && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent-green/15 text-accent-green border border-accent-green/20 uppercase tracking-widest mt-1">Today</span>
              )}
            </div>
            <p className="text-sm text-text-muted font-medium">Daily Trading Log & Reflections</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary hover:border-accent-violet/30 transition-all">
            <Camera size={14} /> Snapshot
          </button>
          <div className="flex items-center gap-2 bg-bg-card/50 p-1 rounded-xl border border-border-subtle/50">
            <button onClick={() => changeDate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95"><ArrowLeft size={16} /></button>
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-text-secondary select-none">
              <Calendar size={13} className="text-accent-violet opacity-70" />
              <span>{format(new Date(selectedDate), "MMM d, yyyy")}</span>
            </div>
            <button onClick={() => changeDate(1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95"><ArrowRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2">
            <CloudSun size={20} className="text-accent-violet" />
            <h2 className="text-xl font-bold tracking-tight">Morning Context</h2>
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-3 bg-bg-card/30 px-4 py-2.5 rounded-xl border border-border-subtle/50">
              <span className="text-xs font-bold text-text-muted">Bias:</span>
              <div className="flex gap-1.5">
                {[
                  { id: "bullish", label: "Bullish", color: "text-accent-green bg-accent-green/10 ring-accent-green/30" },
                  { id: "bearish", label: "Bearish", color: "text-accent-coral bg-accent-coral/10 ring-accent-coral/30" },
                  { id: "neutral", label: "Neutral", color: "text-accent-violet bg-accent-violet/10 ring-accent-violet/30" }
                ].map((b) => (
                  <button key={b.id} onClick={() => setBias(b.id as any)} className={cn("px-3 py-1 rounded-md text-xs font-bold transition-all", bias === b.id ? `${b.color} ring-1 shadow-sm` : "text-text-muted hover:bg-bg-secondary/30")}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-bg-card/30 px-4 py-2.5 rounded-xl border border-border-subtle/50">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5"><Moon size={14}/> Sleep:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} onClick={() => setSleepScore(num)} className={cn("w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all", sleepScore >= num ? "bg-accent-blue/15 text-accent-blue" : "text-text-muted hover:bg-bg-secondary/40")}>{num}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-bg-card/30 px-4 py-2.5 rounded-xl border border-border-subtle/50">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5"><Brain size={14}/> Focus:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} onClick={() => setFocusScore(num)} className={cn("w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all", focusScore >= num ? "bg-accent-green/15 text-accent-green" : "text-text-muted hover:bg-bg-secondary/40")}>{num}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 group">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <Target size={20} className="text-accent-blue" />
            <h2 className="text-xl font-bold tracking-tight">Pre-Market Gameplan</h2>
          </div>
          <textarea ref={preTextareaRef} value={preMarketPlan} onChange={(e) => setPreMarketPlan(e.target.value)} placeholder="What is the roadmap for today?" className="w-full min-h-[100px] bg-transparent border-none p-0 text-sm md:text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 resize-none leading-relaxed" />
        </section>

        <section className="space-y-4 group">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <Sun size={20} className="text-accent-coral" />
            <h2 className="text-xl font-bold tracking-tight">Intraday Observations</h2>
          </div>
          <textarea ref={intraTextareaRef} value={intradayNotes} onChange={(e) => setIntradayNotes(e.target.value)} placeholder="Live thoughts, emotional state changes..." className="w-full min-h-[100px] bg-transparent border-none p-0 text-sm md:text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 resize-none leading-relaxed" />
        </section>

        <section className="space-y-6 group">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <Sunset size={20} className="text-accent-green" />
            <h2 className="text-xl font-bold tracking-tight">Post-Session Review</h2>
          </div>
          <div className="flex items-center gap-4 bg-bg-card/30 px-5 py-3 rounded-xl border border-border-subtle/50 w-fit mb-4">
            <span className="text-xs font-bold text-text-muted">Execution Grade:</span>
            <div className="flex gap-2">
              {["A", "B", "C", "D", "F"].map((grade) => {
                const isActive = sessionGrade === grade;
                const style = grade === "A" || grade === "B" ? "text-accent-green bg-accent-green/10 ring-accent-green/30" : grade === "C" ? "text-accent-violet bg-accent-violet/10 ring-accent-violet/30" : "text-accent-coral bg-accent-coral/10 ring-accent-coral/30";
                return (
                  <button key={grade} onClick={() => setSessionGrade(grade as any)} className={cn("w-8 h-8 rounded-lg text-sm font-black transition-all", isActive ? `${style} ring-1 shadow-sm scale-110` : "text-text-muted hover:bg-bg-secondary/40 bg-bg-card")}>
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>
          <textarea ref={postTextareaRef} value={postMarketReview} onChange={(e) => setPostMarketReview(e.target.value)} placeholder="Lessons learned today? Adjustments?" className="w-full min-h-[150px] bg-transparent border-none p-0 text-sm md:text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 resize-none leading-relaxed" />
        </section>

        <section className="space-y-6 pt-8 border-t border-border-subtle/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-text-primary">
              <TrendingUp size={20} className="text-text-secondary" />
              <h2 className="text-xl font-bold tracking-tight">Session Executions</h2>
            </div>
            {dailyTrades.length > 0 && <span className={cn("text-lg font-black font-[family-name:var(--font-space-mono)]", dailyPnL >= 0 ? "text-accent-green" : "text-accent-coral")}>{dailyPnL >= 0 ? "+" : ""}{formatCurrency(dailyPnL)}</span>}
          </div>
          {dailyTrades.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dailyTrades.map((trade) => {
                const isWin = trade.netPnl >= 0;
                return (
                  <div key={trade.id} className="p-4 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-[family-name:var(--font-space-mono)] font-bold text-sm uppercase", trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>
                        {trade.direction === "long" ? "L" : "S"}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-text-primary">{trade.symbol}</span>
                        <span className="text-[10px] text-text-muted block font-medium">{trade.setupTags[0] || "Custom"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-sm font-black font-[family-name:var(--font-space-mono)] block", isWin ? "text-accent-green" : "text-accent-coral")}>{isWin ? "+" : ""}{formatCurrency(trade.netPnl)}</span>
                      <span className="text-[10px] text-text-muted block font-bold mt-0.5">{trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-center py-10 bg-bg-card/20 rounded-2xl border border-dashed border-border-subtle/50"><Flame size={24} className="mx-auto opacity-20 mb-3" /><p className="text-sm font-semibold text-text-muted">No trades logged.</p></div>
          )}
        </section>
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <button onClick={handleSave} disabled={isSaving} className={cn("flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold shadow-xl transition-all duration-300", saveStatus === "saved" ? "bg-accent-green text-bg-base scale-105" : "bg-text-primary text-bg-base hover:scale-105 hover:shadow-[0_10px_40px_rgba(255,255,255,0.15)]")}>
          {isSaving ? <div className="w-4 h-4 rounded-full border-2 border-bg-base/30 border-t-bg-base animate-spin" /> : saveStatus === "saved" ? <CheckSquare size={18} /> : <Save size={18} />}
          {saveStatus === "saved" ? "Saved" : "Save Journal"}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub-component: The Documents View (Templates & Loss Recaps)
// ----------------------------------------------------------------------
function CustomDocumentsView() {
  const { customNotes, templates, saveCustomNote, deleteCustomNote } = useNotebookStore();
  const { trades } = useTradeStore();
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");

  const handleCreateDoc = () => {
    let content = "";
    if (selectedTemplate !== "blank") {
      const tmpl = templates.find((t) => t.id === selectedTemplate);
      if (tmpl) content = tmpl.content;
      
      // Auto-pull bad trades if it's the loss recap template
      if (selectedTemplate === "tmpl-loss-recap") {
        const recentLosses = trades.filter(t => t.netPnl < 0).sort((a, b) => a.netPnl - b.netPnl).slice(0, 3);
        if (recentLosses.length > 0) {
          content += "\n\n### Auto-Imported Losses to Review:\n";
          recentLosses.forEach(t => {
            content += `- **${t.symbol}** (${t.entryDate}): ${formatCurrency(t.netPnl)} (${t.rMultiple}R)\n`;
          });
        }
      }
    }

    const id = `doc-${Date.now()}`;
    saveCustomNote({
      id, title: newTitle || "Untitled Document", content, date: new Date().toISOString(), type: "custom"
    });
    setActiveDoc(id);
    setShowModal(false);
    setNewTitle(""); setSelectedTemplate("blank");
  };

  const docList = Object.values(customNotes).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (activeDoc && customNotes[activeDoc]) {
    const doc = customNotes[activeDoc];
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4">
          <button onClick={() => setActiveDoc(null)} className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft size={14} /> Back to Library
          </button>
          <div className="flex gap-2">
            <button onClick={() => { deleteCustomNote(doc.id); setActiveDoc(null); }} className="p-2 rounded-lg text-text-muted hover:text-accent-coral hover:bg-accent-coral/10 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <input 
          value={doc.title} 
          onChange={(e) => saveCustomNote({ ...doc, title: e.target.value })} 
          className="w-full bg-transparent border-none p-0 text-3xl md:text-4xl font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 leading-tight"
          placeholder="Document Title"
        />
        
        <textarea 
          value={doc.content} 
          onChange={(e) => {
            saveCustomNote({ ...doc, content: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }} 
          className="w-full min-h-[400px] bg-transparent border-none p-0 text-sm md:text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 resize-none leading-relaxed font-[family-name:var(--font-inter)]"
          placeholder="Start writing..."
          ref={node => { if (node) { node.style.height = 'auto'; node.style.height = node.scrollHeight + 'px'; } }}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-2xl text-text-primary tracking-tight">Trading Wiki Library</h1>
          <p className="text-sm text-text-muted font-medium mt-1">Manage recaps, plans, and custom documents</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-text-primary text-bg-base px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-all">
          <Plus size={16} /> New Document
        </button>
      </div>

      {docList.length === 0 ? (
        <div className="text-center py-20 bg-bg-card/20 rounded-2xl border border-dashed border-border-subtle/50">
          <FileText size={32} className="mx-auto text-text-muted opacity-30 mb-4" />
          <p className="text-sm font-semibold text-text-secondary">Your library is empty.</p>
          <p className="text-xs text-text-muted mt-1">Create a weekly recap or a loss review to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docList.map(doc => (
            <div key={doc.id} onClick={() => setActiveDoc(doc.id)} className="bg-bg-card border border-border-subtle p-5 rounded-2xl cursor-pointer hover:border-accent-violet/40 hover:shadow-[0_4px_20px_rgba(123,97,255,0.05)] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                  <FileText size={20} />
                </div>
              </div>
              <h3 className="font-bold text-text-primary truncate">{doc.title || "Untitled"}</h3>
              <p className="text-xs text-text-muted mt-1">{format(new Date(doc.date), "MMM d, yyyy")}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div className="bg-bg-card w-full max-w-lg m-4 p-6 rounded-2xl border border-border-subtle shadow-2xl" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="font-bold text-xl mb-6 text-text-primary">Create Document</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., September Week 2 Review" className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors text-text-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Template</label>
                  <div className="grid gap-2">
                    <button onClick={() => setSelectedTemplate("blank")} className={cn("p-3 rounded-xl border text-left flex items-center gap-3 transition-all", selectedTemplate === "blank" ? "border-accent-violet bg-accent-violet/5" : "border-border-subtle hover:border-text-muted")}>
                      <LayoutTemplate size={18} className="text-text-muted" />
                      <div><p className="text-sm font-bold text-text-primary">Blank Page</p><p className="text-[10px] text-text-muted mt-0.5">Start from scratch</p></div>
                    </button>
                    {templates.map(tmpl => (
                      <button key={tmpl.id} onClick={() => setSelectedTemplate(tmpl.id)} className={cn("p-3 rounded-xl border text-left flex items-center gap-3 transition-all", selectedTemplate === tmpl.id ? "border-accent-violet bg-accent-violet/5" : "border-border-subtle hover:border-text-muted")}>
                        <FileText size={18} className="text-accent-blue" />
                        <div><p className="text-sm font-bold text-text-primary">{tmpl.name}</p><p className="text-[10px] text-text-muted mt-0.5">Structured analysis framework</p></div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-bold">Cancel</button>
                  <button onClick={handleCreateDoc} className="bg-text-primary text-bg-base px-6 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-all">Create</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}


// ----------------------------------------------------------------------
// Main Page Shell (Sidebar + Content)
// ----------------------------------------------------------------------
export default function NotebookLayout() {
  const [activeTab, setActiveTab] = useState<"daily" | "wiki">("daily");

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 max-w-6xl mx-auto pb-12">
      {/* Sidebar */}
      <div className="w-full md:w-56 flex-shrink-0 space-y-1">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-3 mb-3">Notebook</h3>
        
        <button 
          onClick={() => setActiveTab("daily")}
          className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === "daily" ? "bg-accent-violet/10 text-accent-violet" : "text-text-secondary hover:bg-bg-card hover:text-text-primary")}
        >
          <Calendar size={16} /> Daily Logs
        </button>
        <button 
          onClick={() => setActiveTab("wiki")}
          className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === "wiki" ? "bg-accent-blue/10 text-accent-blue" : "text-text-secondary hover:bg-bg-card hover:text-text-primary")}
        >
          <BookOpen size={16} /> Wiki & Recaps
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {activeTab === "daily" ? <DailyLogView /> : <CustomDocumentsView />}
      </div>
    </div>
  );
}
