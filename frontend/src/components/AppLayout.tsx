import { Building2, Home, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "./Button";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const canOpenAdmin = hasPermission("admin_access", "manage_users", "manage_permissions", "manage_cities");

  const navItems = [
    { to: "/", label: "العقارات", icon: Home, show: true },
    { to: "/admin", label: "الإدارة", icon: ShieldCheck, show: canOpenAdmin }
  ];

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-l border-slate-200 bg-white px-4 py-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-slate-950">Al Kayan</p>
          <p className="text-xs font-semibold text-slate-500">Real Estate Office</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition",
                    isActive ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
      </nav>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="font-bold text-slate-950">{user?.name}</p>
        <p className="break-all text-xs text-slate-500" dir="ltr">
          {user?.email}
        </p>
      </div>
      <Button type="button" variant="ghost" className="mt-3 justify-start" onClick={logout}>
        <LogOut className="h-4 w-4" />
        خروج
      </Button>
    </aside>
  );

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:block">{sidebar}</div>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100" aria-label="Open navigation">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2 font-extrabold text-slate-950">
            <Building2 className="h-5 w-5 text-teal-700" />
            Al Kayan
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} aria-label="Close navigation" />
          <div className="absolute inset-y-0 right-0">
            {sidebar}
            <button type="button" onClick={() => setOpen(false)} className="absolute left-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <main className="px-4 py-6 lg:mr-72 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
