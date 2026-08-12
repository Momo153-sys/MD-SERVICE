import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Camera, CloudOff, RefreshCw, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-auth";

type Lead = {
  localId: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  preferred_major: string;
  lead_source: string;
  photo?: string;
};

const STORAGE_KEY = "field-agent-pending-leads";

export const Route = createFileRoute("/_authenticated/field-agent")({
  head: () => ({
    meta: [
      { title: "Espace terrain — Salons & lycées | SahelTürkiye" },
      { name: "description", content: "Capture rapide de prospects hors ligne lors des salons à Bamako et Dakar." },
      { property: "og:title", content: "Espace terrain — SahelTürkiye" },
      { property: "og:description", content: "Enregistrement de leads étudiants, même sans connexion." },
    ],
  }),
  component: FieldAgentPage,
});

function FieldAgentPage() {
  const { user, role, isStaff, loading } = useRole();
  const allowed = isStaff || role === "AGENT";
  const [pending, setPending] = useState<Lead[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState<Lead>({
    localId: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    preferred_major: "",
    lead_source: "Bamako_Fair_2026",
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setPending(JSON.parse(raw) as Lead[]);
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  function persist(next: Lead[]) {
    setPending(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function sync(list = pending) {
    if (!user || list.length === 0) return;
    setSyncing(true);
    const remaining: Lead[] = [];
    for (const lead of list) {
      const { error } = await supabase.from("student_profiles").insert({
        created_by: user.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone || null,
        email: lead.email || null,
        preferred_major: lead.preferred_major || null,
        lead_source: lead.lead_source,
      });
      if (error) remaining.push(lead);
    }
    persist(remaining);
    setSyncing(false);
    if (remaining.length === 0) toast.success("Tous les prospects sont synchronisés.");
    else toast.error(`${remaining.length} prospect(s) en attente de synchronisation.`);
  }

  useEffect(() => {
    if (online && pending.length > 0 && user) void sync(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, user]);

  if (loading) return <div className="p-10 text-muted-foreground">Chargement...</div>;

  if (!allowed) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Accès réservé au personnel de terrain</h1>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">Retour à mon espace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const registerUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?source=${encodeURIComponent(form.lead_source)}`
      : "";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Espace terrain</h1>
            <p className="text-muted-foreground">Capture rapide, fonctionne hors ligne.</p>
          </div>
          <Badge className={online ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground"}>
            {online ? "En ligne" : <><CloudOff className="size-3.5" /> Hors ligne</>}
          </Badge>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Nouveau prospect</CardTitle>
            <CardDescription>60 secondes suffisent : nom, téléphone, filière visée.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fn">Prénom</Label>
                <Input id="fn" maxLength={60} value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ln">Nom</Label>
                <Input id="ln" maxLength={60} value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph">Téléphone (WhatsApp)</Label>
                <Input id="ph" inputMode="tel" maxLength={30} value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="em">E-mail (optionnel)</Label>
                <Input id="em" type="email" maxLength={255} value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mj">Filière visée</Label>
                <Input id="mj" maxLength={80} value={form.preferred_major}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_major: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="src">Source du lead</Label>
                <Input id="src" maxLength={60} value={form.lead_source}
                  onChange={(e) => setForm((f) => ({ ...f, lead_source: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cap" className="flex items-center gap-2">
                <Camera className="size-4" /> Photo du passeport / fiche papier
              </Label>
              <Input
                id="cap"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  const path = `${user.id}/lead-${Date.now()}.jpg`;
                  const { error } = await supabase.storage.from("student-documents").upload(path, file);
                  if (error) toast.error("Photo non envoyée, réessayez une fois connecté.");
                  else toast.success("Photo enregistrée.");
                }}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (!form.first_name.trim() || !form.last_name.trim()) {
                  toast.error("Le prénom et le nom sont obligatoires.");
                  return;
                }
                const lead = { ...form, localId: crypto.randomUUID() };
                const next = [...pending, lead];
                persist(next);
                setForm((f) => ({
                  ...f,
                  first_name: "",
                  last_name: "",
                  phone: "",
                  email: "",
                  preferred_major: "",
                }));
                toast.success("Prospect enregistré localement.");
                if (navigator.onLine) void sync(next);
              }}
            >
              Enregistrer le prospect
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>En attente de synchronisation</CardTitle>
              <CardDescription>{pending.length} prospect(s) stockés sur cet appareil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.map((l) => (
                <p key={l.localId} className="rounded-lg border border-border p-2 text-sm">
                  {l.first_name} {l.last_name} · {l.phone || "sans téléphone"}
                </p>
              ))}
              <Button variant="secondary" className="w-full" disabled={syncing || pending.length === 0}
                onClick={() => void sync()}>
                <RefreshCw className="size-4" /> Synchroniser maintenant
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>QR code d'inscription</CardTitle>
              <CardDescription>À imprimer sur les flyers du salon.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {registerUrl && <QRCodeSVG value={registerUrl} size={160} />}
              <p className="break-all text-center text-xs text-muted-foreground">{registerUrl}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
