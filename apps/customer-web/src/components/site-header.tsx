"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/neighborhoods", label: "Neighborhoods" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/plans", label: "Plans" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      setAuthReady(true);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const displayName = useMemo(() => {
    const fullName =
      typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    return fullName?.trim() || user?.email || "Account";
  }, [user]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAccountMenuOpen(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-md shadow-[var(--shadow-nav)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-4 md:h-[83px] md:px-6 lg:h-[88px] lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground"
          onClick={() => setOpen(false)}
        >
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M3 7h18l-1.5 11a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 7Z" />
              <path d="M8 7V5a4 4 0 0 1 8 0v2" />
            </svg>
          </span>
          <span className="font-semibold tracking-tight text-base md:text-[17px]">
            Neighborhood<span className="text-primary"> Tasting Menu</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm tracking-tight text-foreground/80 hover:text-foreground transition-colors",
                  active && "font-semibold text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!authReady ? (
            <Button variant="dark" size="sm" disabled>
              Account
            </Button>
          ) : user ? (
            <DropdownMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="dark" size="sm" className="max-w-[220px] gap-1">
                  <span className="truncate">{displayName}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" onClick={() => setAccountMenuOpen(false)}>
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" onClick={() => setAccountMenuOpen(false)}>
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleLogout()}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="dark" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
          <Button variant="black" size="sm" asChild>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-foreground/5 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-canvas lg:hidden">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-foreground/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-3 px-1">
              {!authReady ? (
                <Button variant="dark" size="sm" className="flex-1" disabled>
                  Account
                </Button>
              ) : user ? (
                <>
                  <Button variant="dark" size="sm" className="flex-1" asChild>
                    <Link href="/profile" onClick={() => setOpen(false)}>
                      Profile
                    </Link>
                  </Button>
                  <Button variant="dark" size="sm" className="flex-1" asChild>
                    <Link href="/orders" onClick={() => setOpen(false)}>
                      Orders
                    </Link>
                  </Button>
                  <Button
                    variant="dark"
                    size="sm"
                    className="flex-1"
                    onClick={() => void handleLogout()}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="dark" size="sm" className="flex-1" asChild>
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              )}
              <Button variant="black" size="sm" className="flex-1" asChild>
                <Link href="/checkout" onClick={() => setOpen(false)}>
                  Checkout
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
