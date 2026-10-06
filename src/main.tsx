import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import interRegularUrl from "@fontsource/inter/files/inter-latin-400-normal.woff2?url";
import antonRegularUrl from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
import "./index.css";

for (const href of [interRegularUrl, antonRegularUrl]) {
  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "font";
  preload.type = "font/woff2";
  preload.crossOrigin = "anonymous";
  preload.href = href;
  document.head.append(preload);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
