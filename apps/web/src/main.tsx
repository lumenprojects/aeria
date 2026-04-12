import "./styles/tailwind.css";
import "./styles/tokens.css";
import "./styles/foundation.css";
import "./styles/layout.css";
import "./styles/components/controls.css";
import "./styles/components/catalog.css";
import "./styles/components/editorial.css";
import "./styles/content.css";
import "./styles/pages/home.css";
import "./styles/pages/episodes.css";
import "./styles/pages/characters.css";
import "./styles/pages/atlas.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./lib/theme";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
