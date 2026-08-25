import { MobileHeader, Sidebar } from "@/components/sidebar";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="min-w-0">
        <MobileHeader />
        <main className="app-main">
          <div className="page-wrap">{children}</div>
        </main>
      </div>
    </div>
  );
}
