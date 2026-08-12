import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-auth";
import { ROLES, fr, type AppRole } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({
    meta: [
      { title: "Équipe & rôles — SahelTürkiye" },
      { name: "description", content: "Gérez les conseillers, agents et administrateurs de l'agence." },
      { property: "og:title", content: "Équipe & rôles — SahelTürkiye" },
      { property: "og:description", content: "Attribution des rôles et invitations du personnel." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { isAdmin, loading } = useRole();
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState({ email: "", role: "COUNSELOR" as AppRole });

  const usersQuery = useQuery({
    queryKey: ["team-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      if (error) throw error;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles ?? []).find((r) => r.user_id === p.id)?.role as AppRole | undefined,
      }));
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rôle mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
    },
    onError: (e: Error) => toast.error("Échec : " + e.message),
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      const email = invite.email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Adresse e-mail invalide.");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { role: invite.role, invited: true },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        "Invitation envoyée. Attribuez le rôle définitif dès que la personne aura créé son compte.",
      );
      setInvite((i) => ({ ...i, email: "" }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="p-10 text-muted-foreground">Chargement...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Accès réservé aux administrateurs</h1>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">Retour à mon espace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">Équipe & rôles</h1>
          <p className="text-muted-foreground">Invitez du personnel et gérez les permissions.</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Inviter un membre</CardTitle>
            <CardDescription>Un lien de connexion sécurisé est envoyé par e-mail.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1 space-y-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                maxLength={255}
                value={invite.email}
                onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))}
                placeholder="conseiller@agence.ml"
              />
            </div>
            <div className="w-48 space-y-2">
              <Label>Rôle prévu</Label>
              <Select
                value={invite.role}
                onValueChange={(v) => setInvite((i) => ({ ...i, role: v as AppRole }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{fr.role[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => sendInvite.mutate()} disabled={sendInvite.isPending}>
              Envoyer l'invitation
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Utilisateurs enregistrés</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="w-52">Rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersQuery.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.full_name ?? "—"}</TableCell>
                    <TableCell>{u.email ?? "—"}</TableCell>
                    <TableCell>{u.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role ?? "STUDENT"}
                        onValueChange={(v) => changeRole.mutate({ userId: u.id, role: v as AppRole })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{fr.role[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
