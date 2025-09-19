import { ThemeToggle } from "@/components/theme-toggle";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">GitHub Raw Indexer</div>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t">
        <div className="container h-12 text-sm text-muted-foreground flex items-center">
          <span>Built with Next.js + Tailwind + shadcn/ui</span>
        </div>
      </footer>
    </div>
  );
}
