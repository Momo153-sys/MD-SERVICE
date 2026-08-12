import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, Menu } from "lucide-react";
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
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span>MD<span className="text-success">SERVICE</span></span>
        </Link>

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

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Déconnexion
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
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <div className={cn("border-t border-border/70 md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          {publicLinks.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user && (
            <Link to="/dashboard" className="rounded-md px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              Mon espace
            </Link>
          )}
          {isStaff && (
            <Link to="/admin" className="rounded-md px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              Administration
            </Link>
          )}
          {(role === "AGENT" || isStaff) && (
            <Link to="/field-agent" className="rounded-md px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              Terrain
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
