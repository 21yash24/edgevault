"use client";
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

function ScreenerWidget() {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.type = "text/javascript";
    script.async = true;
    
    const theme = resolvedTheme === 'light' ? 'light' : 'dark';

    script.innerHTML = `
      {
        "width": "100%",
        "height": "100%",
        "defaultColumn": "overview",
        "defaultScreen": "most_capitalized",
        "market": "america",
        "showToolbar": true,
        "colorTheme": "${theme}",
        "locale": "en",
        "isTransparent": true
      }`;
    
    container.current.appendChild(script);
  }, [resolvedTheme]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}

export default memo(ScreenerWidget);
