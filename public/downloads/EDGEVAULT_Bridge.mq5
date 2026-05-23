//+------------------------------------------------------------------+
//|                                         EDGEVAULT_Bridge.mq5     |
//|                    Copyright 2024, EDGEVAULT Trading OS           |
//|                            https://edgevault.app                  |
//+------------------------------------------------------------------+
#property copyright   "EDGEVAULT Trading OS"
#property link        "https://edgevault.app"
#property version     "1.00"
#property description "Automatically syncs closed trades to your EDGEVAULT journal."
#property description "Setup: Add your EDGEVAULT API endpoint to allowed WebRequest URLs"
#property description "(Tools → Options → Expert Advisors → Allow WebRequest)."

//--- Input Parameters
input string  API_Key       = "local-key";                // Your EDGEVAULT API Key
input string  API_Endpoint  = "http://localhost:3000/api/mt5/sync";  // API Endpoint
input int     SyncInterval  = 5;                 // Sync check interval (seconds)
input bool    SyncOnClose   = true;              // Sync immediately on position close
input bool    ShowAlerts    = true;              // Show sync alerts on chart

//--- Global Variables
long     lastSyncedDeal = 0;
datetime lastSyncTime   = 0;
int      syncCount      = 0;
int      errorCount     = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   if(API_Key == "")
   {
      Alert("EDGEVAULT Bridge: Please enter your API Key in the EA inputs.");
      return(INIT_PARAMETERS_INCORRECT);
   }
   
   // Load last synced deal from global variable
   if(GlobalVariableCheck("EDGEVAULT_LastDeal"))
      lastSyncedDeal = (long)GlobalVariableGet("EDGEVAULT_LastDeal");
   
   // Set timer for periodic sync
   EventSetTimer(SyncInterval);
   
   Comment("EDGEVAULT Bridge v1.0 | Connected | Synced: ", syncCount, " trades");
   
   if(ShowAlerts)
      Print("EDGEVAULT Bridge initialized. API Key: ", StringSubstr(API_Key, 0, 8), "...");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Comment("");
   Print("EDGEVAULT Bridge disconnected. Total synced: ", syncCount);
}

//+------------------------------------------------------------------+
//| Timer function - periodic sync check                              |
//+------------------------------------------------------------------+
void OnTimer()
{
   SyncClosedDeals();
}

//+------------------------------------------------------------------+
//| Trade event - sync on position close                              |
//+------------------------------------------------------------------+
void OnTrade()
{
   if(SyncOnClose)
      SyncClosedDeals();
}

//+------------------------------------------------------------------+
//| Main sync function - finds and sends new closed deals             |
//+------------------------------------------------------------------+
void SyncClosedDeals()
{
   datetime fromTime = (lastSyncTime > 0) ? lastSyncTime : TimeCurrent() - 86400 * 30; // Last 30 days on first run
   datetime toTime   = TimeCurrent();
   
   if(!HistorySelect(fromTime, toTime))
   {
      Print("EDGEVAULT: Failed to select history");
      return;
   }
   
   int totalDeals = HistoryDealsTotal();
   
   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      
      // Skip already synced deals
      if((long)ticket <= lastSyncedDeal) continue;
      
      // Only sync closing deals (DEAL_ENTRY_OUT or DEAL_ENTRY_INOUT)
      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(dealEntry != DEAL_ENTRY_OUT && dealEntry != DEAL_ENTRY_INOUT) continue;
      
      // Only sync actual trades (not balance operations)
      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;
      
      // Get deal details
      string symbol    = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double price     = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double volume    = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double profit    = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double commission= HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double swap      = HistoryDealGetDouble(ticket, DEAL_SWAP);
      datetime time    = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      string comment   = HistoryDealGetString(ticket, DEAL_COMMENT);
      long   magic     = HistoryDealGetInteger(ticket, DEAL_MAGIC);
      long   posId     = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      
      // Determine direction (closing deal is opposite of position direction)
      string direction = (dealType == DEAL_TYPE_SELL) ? "long" : "short";
      
      // Find the opening deal for entry price and SL/TP
      double entryPrice = 0, sl = 0, tp = 0;
      datetime entryTime = time;
      
      if(posId > 0)
      {
         // Search for the opening deal of this position
         for(int j = 0; j < totalDeals; j++)
         {
            ulong openTicket = HistoryDealGetTicket(j);
            if(openTicket == 0) continue;
            if(HistoryDealGetInteger(openTicket, DEAL_POSITION_ID) != posId) continue;
            if(HistoryDealGetInteger(openTicket, DEAL_ENTRY) == DEAL_ENTRY_IN)
            {
               entryPrice = HistoryDealGetDouble(openTicket, DEAL_PRICE);
               entryTime  = (datetime)HistoryDealGetInteger(openTicket, DEAL_TIME);
               // Note: SL/TP are not stored in deal history, would need position info
               break;
            }
         }
      }
      
      if(entryPrice == 0) entryPrice = price; // Fallback
      
      // Build JSON payload
      string json = StringFormat(
         "{"
         "\"apiKey\":\"%s\","
         "\"ticket\":%llu,"
         "\"positionId\":%lld,"
         "\"symbol\":\"%s\","
         "\"direction\":\"%s\","
         "\"entryPrice\":%.5f,"
         "\"exitPrice\":%.5f,"
         "\"stopLoss\":%.5f,"
         "\"takeProfit\":%.5f,"
         "\"volume\":%.2f,"
         "\"profit\":%.2f,"
         "\"commission\":%.2f,"
         "\"swap\":%.2f,"
         "\"netPnl\":%.2f,"
         "\"entryTime\":\"%s\","
         "\"exitTime\":\"%s\","
         "\"comment\":\"%s\","
         "\"magic\":%lld,"
         "\"accountId\":%lld,"
         "\"broker\":\"%s\","
         "\"accountBalance\":%.2f"
         "}",
         API_Key,
         ticket,
         posId,
         symbol,
         direction,
         entryPrice,
         price,
         sl,
         tp,
         volume,
         profit,
         commission,
         swap,
         profit + commission + swap,
         TimeToString(entryTime, TIME_DATE | TIME_SECONDS),
         TimeToString(time, TIME_DATE | TIME_SECONDS),
         comment,
         magic,
         AccountInfoInteger(ACCOUNT_LOGIN),
         AccountInfoString(ACCOUNT_COMPANY),
         AccountInfoDouble(ACCOUNT_BALANCE)
      );
      
      // Send to EDGEVAULT
      if(SendToAPI(json))
      {
         lastSyncedDeal = (long)ticket;
         lastSyncTime   = time;
         syncCount++;
         GlobalVariableSet("EDGEVAULT_LastDeal", (double)lastSyncedDeal);
         
         if(ShowAlerts)
            Print("EDGEVAULT: Synced ", symbol, " ", direction, " | P&L: $", DoubleToString(profit, 2));
      }
   }
   
   Comment("EDGEVAULT Bridge v1.0 | ✓ Connected | Synced: ", syncCount, " | Errors: ", errorCount,
           "\nLast sync: ", TimeToString(TimeCurrent(), TIME_SECONDS));
}

//+------------------------------------------------------------------+
//| Send JSON data to EDGEVAULT API via HTTP POST                     |
//+------------------------------------------------------------------+
bool SendToAPI(string jsonPayload)
{
   char   postData[];
   char   result[];
   string headers = "Content-Type: application/json\r\nx-api-key: " + API_Key + "\r\n";
   string responseHeaders;
   int    timeout = 5000; // 5 seconds
   
   StringToCharArray(jsonPayload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   
   // Remove null terminator that StringToCharArray adds
   ArrayResize(postData, ArraySize(postData) - 1);
   
   int res = WebRequest("POST", API_Endpoint, headers, timeout, postData, result, responseHeaders);
   
   if(res == -1)
   {
      int error = GetLastError();
      errorCount++;
      
      if(error == 4060)
         Print("EDGEVAULT ERROR: URL not allowed. Go to Tools → Options → Expert Advisors → Add: ", API_Endpoint);
      else
         Print("EDGEVAULT ERROR: WebRequest failed. Error: ", error);
      
      return false;
   }
   
   if(res != 200)
   {
      string responseStr = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("EDGEVAULT ERROR: Server returned HTTP ", res, ": ", responseStr);
      errorCount++;
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
