"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { status, data } = await apiRequest<{
          admin?: { username?: string };
        }>("/api/auth/me");

        if (cancelled) {
          return;
        }

        if (status !== 200 || !data.success) {
          router.replace("/login");
          return;
        }

        setUsername(data.admin?.username ?? "Admin");
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-100 text-sm text-slate-600">
        Checking admin session...
      </div>
    );
  }

  if (!username) {
    return null;
  }

  return (
    <div className="min-h-full bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
              College examination seating
            </p>
            <h1 className="text-lg font-semibold">Admin console</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-300">Signed in as {username}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 pb-3">
          <Link
            href="/admin/classrooms"
            className={`inline-flex rounded-lg px-3 py-1.5 text-sm ${
              pathname.startsWith("/admin/classrooms")
                ? "bg-white text-slate-900"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            Classrooms
          </Link>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
