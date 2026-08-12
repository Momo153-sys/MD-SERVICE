import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const publicLinks = [
  { to: "/universities", label: "Universités & Budget" },
  { to: "/guide-documents", label: "Guide des documents" },
] as const;

export function SiteHeader() {
  const { user, role, isStaff } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold shrink-0">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="whitespace-nowrap">
            MD<span className="text-success">SERVICE</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              Mon espace
            </Link>
          )}
          {isStaff && (
            <Link
              to="/admin"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Administration
            </Link>
          )}
          {(role === "AGENT" || isStaff) && (
            <Link
              to="/field-agent"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Terrain
            </Link>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Desktop Auth Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="size-4 mr-1.5" /> Déconnexion
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register" search={{ major: undefined, source: undefined }}>
                    Créer un compte
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Single CTA for Non-logged-in Users */}
          {!user && (
            <div className="sm:hidden">
              <Button size="sm" className="text-xs px-2.5 h-8" asChild>
                <Link to="/register" search={{ major: undefined, source: undefined }}>
                  S'inscrire
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={cn("border-t border-border/70 md:hidden bg-background", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Mon espace
            </Link>
          )}
          {isStaff && (
            <Link
              to="/admin"
              className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Administration
            </Link>
          )}
          {(role === "AGENT" || isStaff) && (
            <Link
              to="/field-agent"
              className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Terrain
            </Link>
          )}

          <div className="my-2 border-t border-border/50" />

          {/* Mobile Dropdown Auth Links */}
          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 text-left w-full"
            >
              <LogOut className="size-4" /> Déconnexion
            </button>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/auth"
                className="rounded-md px-3 py-2 text-sm font-medium text-center border border-input hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Se connecter
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}