"use client";
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

function MarketOverviewWidget() {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    
    const theme = resolvedTheme === 'light' ? 'light' : 'dark';

    script.innerHTML = `
      {
        "colorTheme": "${theme}",
        "dateRange": "12M",
        "showChart": true,
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": true,
        "showFloatingTooltip": false,
        "width": "100%",
        "height": "100%",
        "tabs": [
          {
            "title": "Indices",
            "symbols": [
              { "s": "FOREXCOM:SPXUSD", "d": "S&P 500 Index" },
              { "s": "FOREXCOM:NSXUSD", "d": "US 100 Cash CFDs" },
              { "s": "FOREXCOM:DJI", "d": "Dow Jones Industrial Average" },
              { "s": "INDEX:NKY", "d": "Nikkei 225" },
              { "s": "INDEX:DEU40", "d": "DAX Index" },
              { "s": "FOREXCOM:UKXGBP", "d": "UK 100" }
            ],
            "originalTitle": "Indices"
          },
          {
            "title": "Futures",
            "symbols": [
              { "s": "CME_MINI:ES1!", "d": "S&P 500" },
              { "s": "CME:6E1!", "d": "Euro" },
              { "s": "COMEX:GC1!", "d": "Gold" },
              { "s": "NYMEX:CL1!", "d": "WTI Crude Oil" },
              { "s": "NYMEX:NG1!", "d": "Gas" },
              { "s": "CBOT:ZC1!", "d": "Corn" }
            ],
            "originalTitle": "Futures"
          },
          {
            "title": "Bonds",
            "symbols": [
              { "s": "CBOT:ZB1!", "d": "T-Bond" },
              { "s": "CBOT:UB1!", "d": "Ultra T-Bond" },
              { "s": "EUREX:FGBL1!", "d": "Euro Bund" },
              { "s": "EUREX:FBTP1!", "d": "Euro BTP" },
              { "s": "EUREX:FGBM1!", "d": "Euro BOBL" }
            ],
            "originalTitle": "Bonds"
          },
          {
            "title": "Forex",
            "symbols": [
              { "s": "FX:EURUSD", "d": "EUR to USD" },
              { "s": "FX:GBPUSD", "d": "GBP to USD" },
              { "s": "FX:USDJPY", "d": "USD to JPY" },
              { "s": "FX:USDCHF", "d": "USD to CHF" },
              { "s": "FX:AUDUSD", "d": "AUD to USD" },
              { "s": "FX:USDCAD", "d": "USD to CAD" }
            ],
            "originalTitle": "Forex"
          }
        ]
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

export default memo(MarketOverviewWidget);
