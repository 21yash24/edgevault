"use client";
import { useState, useMemo } from "react";
import { Trade } from "@/lib/types";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { formatCurrency, cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-static px-3 py-2 rounded-lg text-xs">
        <p className="font-bold text-text-primary">{data.symbol}</p>
        <p className="text-text-secondary mt-1">P&L: <span className={data.netPnl >= 0 ? "text-accent-green" : "text-accent-coral"}>{formatCurrency(data.netPnl)}</span></p>
        {data.mae !== undefined && <p className="text-text-secondary">MAE: <span className="text-accent-coral">{formatCurrency(data.mae)}</span></p>}
        {data.mfe !== undefined && <p className="text-text-secondary">MFE: <span className="text-accent-green">{formatCurrency(data.mfe)}</span></p>}
      </div>
    );
  }
  return null;
};

export function MaeMfeChart({ trades }: { trades: Trade[] }) {
  const [view, setView] = useState<"MAE" | "MFE">("MAE");

  const data = useMemo(() => {
    return trades.filter(t => (view === "MAE" ? t.mae !== undefined : t.mfe !== undefined)).map(t => ({
      ...t,
      // For charting, we want the absolute magnitude of MAE on the X axis, or just leave it negative.
      // Usually MAE is plotted positive on X. We'll use absolute value so it goes from 0 to +X
      xVal: view === "MAE" ? Math.abs(t.mae || 0) : t.mfe || 0,
      yVal: t.netPnl
    }));
  }, [trades, view]);

  if (data.length === 0) {
    return <div className="h-full flex items-center justify-center text-sm text-text-muted">No MAE/MFE data available.</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-1 mb-4 z-10 relative">
        <button
          onClick={() => setView("MAE")}
          className={cn(
            "px-3 py-1 text-xs rounded-lg transition-colors border",
            view === "MAE" ? "bg-accent-violet/10 text-accent-violet border-accent-violet/20" : "bg-bg-card text-text-secondary border-transparent hover:border-border-subtle hover:text-text-primary"
          )}
        >
          MAE vs P&L
        </button>
        <button
          onClick={() => setView("MFE")}
          className={cn(
            "px-3 py-1 text-xs rounded-lg transition-colors border",
            view === "MFE" ? "bg-accent-violet/10 text-accent-violet border-accent-violet/20" : "bg-bg-card text-text-secondary border-transparent hover:border-border-subtle hover:text-text-primary"
          )}
        >
          MFE vs P&L
        </button>
      </div>

      <div className="flex-1 relative -mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              type="number" 
              dataKey="xVal" 
              name={view}
              tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
              tickFormatter={(v) => `$${v}`}
              axisLine={false}
              tickLine={false}
              label={{ value: view === "MAE" ? "Maximum Adverse Excursion ($)" : "Maximum Favorable Excursion ($)", position: "bottom", fill: "#8B8FA3", fontSize: 10 }}
            />
            <YAxis 
              type="number" 
              dataKey="yVal" 
              name="Net P&L"
              tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
              tickFormatter={(v) => `$${v}`}
              axisLine={false}
              tickLine={false}
              label={{ value: "Net P&L ($)", angle: -90, position: "left", fill: "#8B8FA3", fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Scatter name="Trades" data={data} animationDuration={1000}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.yVal >= 0 ? "rgba(0, 255, 178, 0.6)" : "rgba(255, 45, 85, 0.6)"} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
