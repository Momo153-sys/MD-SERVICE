import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Créer mon dossier étudiant — MD SERVICE" },
      {
        name: "description",
        content: "Pré-inscription gratuite en 2 minutes pour étudier dans une université turque.",
      },
      { property: "og:title", content: "Créer mon dossier étudiant — MD SERVICE" },
      { property: "og:description", content: "Pré-inscription gratuite pour étudier en Türkiye." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    major: typeof search["major"] === "string" ? (search["major"] as string) : undefined,
    source: typeof search["source"] === "string" ? (search["source"] as string) : undefined,
  }),
  component: RegisterPage,
});

const schema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis").max(80),
  lastName: z.string().trim().min(2, "Nom requis").max(80),
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  phone: z.string().trim().min(6, "Numéro WhatsApp requis").max(30),
  password: z.string().min(8, "8 caractères minimum").max(72),
  country: z.string().min(2),
  major: z.string().trim().max(120).optional(),
});

const countries = ["Mali", "Sénégal", "Guinée", "Côte d'Ivoire", "Burkina Faso", "Niger", "Autre"];

function RegisterPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    country: "Mali",
    major: search.major ?? "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: `${form.firstName} ${form.lastName}`,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          country: form.country,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast.error("Inscription impossible : " + error.message);
      return;
    }

    if (data.user) {
      // Create student_profiles row linked to user_id
      const { error: profileError } = await supabase.from("student_profiles").insert({
        user_id: data.user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        country_of_origin: form.country,
        preferred_major: form.major || null,
        lead_source: search.source ?? "Inscription_Web",
      });

      if (profileError) {
        console.error("Student profile error:", profileError);
      }
    }

    setLoading(false);

    if (data.session) {
      toast.success("Votre dossier a été créé avec succès !");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.success("Vérifiez votre boîte e-mail pour confirmer votre inscription.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Créer mon dossier</CardTitle>
            <CardDescription>
              Pré-inscription gratuite. Un conseiller vous contactera sur WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro WhatsApp</Label>
                <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Ex: +223 ..." />
              </div>
              <div className="space-y-2">
                <Label>Pays d'origine</Label>
                <Select value={form.country} onValueChange={(v) => set("country", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Filière souhaitée</Label>
                <Input id="major" value={form.major} onChange={(e) => set("major", e.target.value)} placeholder="Ex: Génie informatique" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
              </div>
              <Button type="submit" className="sm:col-span-2" disabled={loading}>
                {loading ? "Création en cours..." : "Créer mon dossier"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link to="/auth" className="font-medium text-primary underline">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}