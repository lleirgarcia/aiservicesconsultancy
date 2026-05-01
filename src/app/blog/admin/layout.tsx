import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { readAdminSession } from "@/lib/blog/requireAdmin";
import { blogT } from "@/i18n/blogServer";
import { LogoutButton } from "@/components/blog/admin/LogoutButton";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerStore = await headers();
  const path =
    headerStore.get("x-invoke-path") ??
    headerStore.get("next-url") ??
    "/blog/admin";

  const session = await readAdminSession();

  // En la página de login NO redirigimos (sería bucle).
  const onLoginPage = path.endsWith("/blog/admin/login");

  if (!session.authenticated && !onLoginPage) {
    const from = encodeURIComponent(path);
    redirect(`/blog/admin/login?from=${from}`);
  }

  const t = blogT();

  if (onLoginPage) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center px-4">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/blog/admin"
              className="font-headline text-sm sm:text-base text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
            >
              {t.admin.list.title}
            </Link>
            <Link
              href="/blog"
              className="text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
              ↗ Ver blog público
            </Link>
          </div>
          <LogoutButton label={t.admin.list.logout} />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
