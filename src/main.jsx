import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/clerk-react";
import { ThemeProvider } from "./components/ThemeProvider";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signUpForceRedirectUrl={import.meta.env.VITE_CLERK_REDIRECT_URL}
      signInForceRedirectUrl={import.meta.env.VITE_CLERK_REDIRECT_URL}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>
);
