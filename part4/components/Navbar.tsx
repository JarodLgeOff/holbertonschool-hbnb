"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LogOut, Menu, MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getToken, clearToken, clearUserInfo } from "@/lib/auth";
import { useAuth, dispatchAuthChange } from "@/lib/useAuth";

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const toggleTheme = () => {
    setIsDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  if (!mounted) {
    return <div className="h-10 w-10 rounded-full border border-border bg-background" />;
  }

  return (
    <Button aria-label="Changer le thème" className="rounded-full" size="icon" variant="outline" onClick={toggleTheme} type="button">
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </Button>
  );
}

function UserMenu({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const { fullName, mounted } = useAuth();

  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    clearToken();
    clearUserInfo();
    dispatchAuthChange();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full">
          {fullName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="text-sm text-muted-foreground">
          {fullName}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
          Profil
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer">
            Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileUserActions({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const { fullName, mounted } = useAuth();

  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    clearToken();
    clearUserInfo();
    dispatchAuthChange();
    router.push("/");
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
      <div className="text-sm text-muted-foreground">{fullName}</div>
      <Button asChild variant="outline" className="w-full justify-start">
        <Link href="/profile" onClick={() => router.push("/profile")}>Profil</Link>
      </Button>
      {isAdmin && (
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/admin" onClick={() => router.push("/admin")}>Admin</Link>
        </Button>
      )}
      <Button type="button" variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Déconnexion
      </Button>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isAdmin, mounted } = useAuth();

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3 text-base font-semibold tracking-tight" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            H
          </span>
          <span>Hbnb</span>
        </Link>



        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {mounted && (
            isAuthenticated ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/places/manage">Mes lieux</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/places">Les lieux</Link>
                </Button>
                <UserMenu isAdmin={isAdmin} />
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    Commencer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
            <SheetTrigger asChild>
              <Button aria-label="Ouvrir le menu" className="rounded-full" size="icon" variant="outline" type="button">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-8" side="right">
              <SheetHeader>
                <SheetTitle>Hbnb</SheetTitle>
              </SheetHeader>

              <div className="mt-auto flex flex-col gap-3">
                {mounted && (
                  isAuthenticated ? (
                    <>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/places/manage" onClick={() => setMobileOpen(false)}>
                          Mes lieux
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/places" onClick={() => setMobileOpen(false)}>
                          Les lieux
                        </Link>
                      </Button>
                      <MobileUserActions isAdmin={isAdmin} />
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline">
                        <Link href="/login" onClick={() => setMobileOpen(false)}>
                          Connexion
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/register" onClick={() => setMobileOpen(false)}>
                          Commencer
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  )
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}