import { NavSidebar, MobileNav } from "@/components/nav-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <NavSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileNav />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
