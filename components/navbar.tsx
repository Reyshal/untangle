"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Sparkles, ListTodo, Calendar, Plus, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { Button } from "./ui/button";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          href={session?.user ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1 py-0.5"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-white shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold tracking-tight text-lg text-foreground">
            untangle<span className="text-primary font-bold">.</span>
          </span>
        </Link>

        {/* Center / Nav actions if logged in */}
        {!isAuthPage && (
          <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/dashboard"
                  ? "bg-background-subtle text-foreground font-semibold"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-subtle/60"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Lists</span>
            </Link>
            <Link
              href="/dashboard/schedule"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/dashboard/schedule"
                  ? "bg-background-subtle text-foreground font-semibold"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-subtle/60"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </Link>
            <Link
              href="/dashboard/new"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/dashboard/new"
                  ? "bg-background-subtle text-foreground font-semibold"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-subtle/60"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>New Brain Dump</span>
            </Link>
          </nav>
        )}

        {/* Right side items */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isAuthPage && (
            <>
              {session?.user ? (
                <div className="flex items-center gap-2 ml-2">
                  <div className="hidden md:flex flex-col items-end text-xs">
                    <span className="font-medium text-foreground">{session.user.name || "Explorer"}</span>
                    <span className="text-foreground-muted">{session.user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="text-foreground-muted hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Sign Out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/dashboard/new">
                    <Button variant="primary" size="sm">
                      Try Now
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
