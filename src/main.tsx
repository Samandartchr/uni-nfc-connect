import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import "./styles.css";

import IndexPage from "@/pages/Index";
import AuthPage from "@/pages/Auth";
import FeedPage from "@/pages/Feed";
import GrowPage from "@/pages/Grow";
import MessagesPage from "@/pages/Messages";
import PostPage from "@/pages/Post";
import ProfilePage from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<IndexPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/grow" element={<GrowPage />} />
              <Route path="/post" element={<PostPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
