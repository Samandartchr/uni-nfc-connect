import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-7xl">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:shadow-glow-strong"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UniConnect — Твой ключ к универу" },
      { name: "description", content: "NFC-сеть для студентов: знакомства за секунду, профили, лента и клубы." },
      { name: "author", content: "UniConnect" },
      { property: "og:title", content: "UniConnect — Твой ключ к универу" },
      { property: "og:description", content: "Прикоснись брелоком к телефону — открой профиль и знакомься." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
