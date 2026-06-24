"use client";
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

function MarketNewsWidget() {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.type = "text/javascript";
    script.async = true;
    
    const theme = resolvedTheme === 'light' ? 'light' : 'dark';

    script.innerHTML = `
      {
        "feedMode": "all_symbols",
        "isTransparent": true,
        "displayMode": "regular",
        "width": "100%",
        "height": "100%",
        "colorTheme": "${theme}",
        "locale": "en"
      }`;
    
    container.current.appendChild(script);
  }, [resolvedTheme]);

  if (!resolvedTheme) {
    return <div className="w-full h-full bg-bg-card/20 animate-pulse" />;
  }

  return (
    <div key={resolvedTheme} className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}

export default memo(MarketNewsWidget);
