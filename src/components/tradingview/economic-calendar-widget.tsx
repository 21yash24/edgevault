"use client";
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

function EconomicCalendarWidget() {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = ''; // Clean up for re-renders

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    
    const theme = resolvedTheme === 'light' ? 'light' : 'dark';

    script.innerHTML = `
      {
        "colorTheme": "${theme}",
        "isTransparent": true,
        "width": "100%",
        "height": "100%",
        "locale": "en",
        "importanceFilter": "-1,0,1",
        "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu"
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

export default memo(EconomicCalendarWidget);
