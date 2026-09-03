"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import {
  Sparkles,
  ListTodo,
  Calendar,
  Plus,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { Button } from "./ui/button";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);

  useBodyScrollLock(isMobileMenuOpen);

  const closeMobileMenu = React.useCallback(() => {
    if (isMenuClosing || !isMobileMenuOpen) return;
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMenuClosing(false);
      setIsMobileMenuOpen(false);
    }, 180);
  }, [isMenuClosing, isMobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen && !isMenuClosing) {
        closeMobileMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen, isMenuClosing, closeMobileMenu]);

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      setIsMobileMenuOpen(true);
    }
  };

  const handleSignOut = async () => {
    closeMobileMenu();
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const navLinks = [
    {
      href: "/dashboard",
      label: "Lists & Projects",
      shortLabel: "Lists",
      icon: <ListTodo className="w-4 h-4" />,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/schedule",
      label: "Schedule & Agenda",
      shortLabel: "Schedule",
      icon: <Calendar className="w-4 h-4" />,
      active: pathname === "/dashboard/schedule",
    },
    {
      href: "/dashboard/new",
      label: "New Brain Dump",
      shortLabel: "New Brain Dump",
      icon: <Plus className="w-4 h-4" />,
      active: pathname === "/dashboard/new",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          href={
            isPending
              ? pathname.startsWith("/dashboard")
                ? "/dashboard"
                : "/"
              : session?.user
                ? "/dashboard"
                : "/"
          }
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1 py-0.5"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-amber-600 flex items-center justify-center text-white shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold tracking-tight text-lg text-foreground">
            untangle<span className="text-primary font-bold">.</span>
          </span>
        </Link>

        {/* Center / Desktop Nav actions */}
        {!isAuthPage && (
          <>
            {isPending ? (
              pathname.startsWith("/dashboard") ? (
                <div className="hidden sm:flex items-center gap-1.5 animate-pulse">
                  <div className="w-16 h-7 rounded-lg bg-border/50" />
                  <div className="w-20 h-7 rounded-lg bg-border/50" />
                  <div className="w-28 h-7 rounded-lg bg-border/50" />
                </div>
              ) : null
            ) : session?.user ? (
              <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                      link.active
                        ? "bg-background-subtle text-foreground font-semibold"
                        : "text-foreground-muted hover:text-foreground hover:bg-background-subtle/60"
                    }`}
                  >
                    {link.icon}
                    <span>{link.shortLabel}</span>
                  </Link>
                ))}
              </nav>
            ) : null}
          </>
        )}

        {/* Right side items */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isAuthPage && (
            <>
              {isPending ? (
                <div className="flex items-center gap-2">
                  {/* Desktop skeleton */}
                  <div className="hidden sm:flex items-center gap-2 ml-2 animate-pulse">
                    <div className="hidden md:flex flex-col items-end gap-1.5">
                      <div className="w-20 h-3 bg-border/60 rounded-md" />
                      <div className="w-28 h-2.5 bg-border/40 rounded-md" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-border/50" />
                  </div>
                  {/* Mobile skeleton */}
                  <div className="sm:hidden w-8 h-8 rounded-lg bg-border/50 animate-pulse" />
                </div>
              ) : session?.user ? (
                <>
                  {/* Desktop user profile & sign out */}
                  <div className="hidden sm:flex items-center gap-2 ml-2">
                    <div className="hidden md:flex flex-col items-end text-xs">
                      <span className="font-medium text-foreground">
                        {session.user.name || "Explorer"}
                      </span>
                      <span className="text-foreground-muted">
                        {session.user.email}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      title="Sign Out"
                      className="text-foreground-muted hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden md:inline text-xs">Sign Out</span>
                    </Button>
                  </div>

                  {/* Mobile hamburger menu toggle button */}
                  <button
                    type="button"
                    onClick={toggleMobileMenu}
                    aria-label={
                      isMobileMenuOpen && !isMenuClosing
                        ? "Close menu"
                        : "Open menu"
                    }
                    className="sm:hidden p-2 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background-subtle transition-colors cursor-pointer"
                  >
                    {isMobileMenuOpen && !isMenuClosing ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>
                </>
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

      {/* Mobile Menu Dropdown Drawer */}
      {!isAuthPage && (isMobileMenuOpen || isMenuClosing) && (
        <>
          {/* Subtle backdrop overlay behind drawer */}
          <div
            className={`sm:hidden fixed inset-0 top-14 bg-black/40 backdrop-blur-xs -z-10 ${
              isMenuClosing ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            onClick={closeMobileMenu}
          />

          {/* Absolute floating drawer */}
          <div
            className={`sm:hidden absolute top-full left-0 right-0 border-b border-border bg-card/98 backdrop-blur-md px-4 pt-3 pb-5 flex flex-col gap-3.5 shadow-2xl ${
              isMenuClosing ? "animate-menu-up" : "animate-menu-down"
            }`}
          >
            {session?.user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background-subtle border border-border/70">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {session.user.name ? (
                    session.user.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {session.user.name || "Explorer"}
                  </span>
                  <span className="text-xs text-foreground-muted truncate">
                    {session.user.email}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    link.active
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${link.active ? "bg-primary text-white" : "bg-background-subtle text-foreground-muted"}`}
                  >
                    {link.icon}
                  </div>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile Sign Out */}
            {session?.user && (
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
