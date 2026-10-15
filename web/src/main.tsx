import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "./i18n";
import { wagmiConfig } from "./lib/wagmi";
import { ThemeProvider } from "./state/theme";
import { SessionProvider } from "./state/session";
import { UIProvider } from "./state/ui";
import { TooltipProvider } from "./components/ui/tooltip";
import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SessionProvider>
            <UIProvider>
            <TooltipProvider>
              <App />
            </TooltipProvider>
            </UIProvider>
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
