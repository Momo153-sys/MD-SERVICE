import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { BudgetCalculator } from "@/components/budget-calculator";
import { supabase } from "@/integrations/supabase/client";
import { fr, formatMoney, type DegreeLevel, type ProgLanguage } from "@/lib/domain";

export const Route = createFileRoute("/universities")({
  head: () => ({
    meta: [
      { title: "Universités turques & calculateur de budget étudiant" },
      {
        name: "description",
        content:
          "Comparez les universités d'Istanbul, Ankara et Izmir, les tarifs agence réduits et estimez votre budget mensuel de vie en Türkiye.",
      },
      { property: "og:title", content: "Catalogue des universités turques & budget" },
      {
        property: "og:description",
        content: "Tarif officiel vs tarif agence, et calcul du coût de la vie par ville.",
      },
    ],
  }),
  component: UniversitiesPage,
});

function UniversitiesPage() {
  const [city, setCity] = useState("all");
  const [degree, setDegree] = useState("all");
  const [language, setLanguage] = useState("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["universities-programs"],
    queryFn: async () => {
      const [u, p] = await Promise.all([
        supabase.from("universities").select("*").order("name"),
        supabase.from("programs").select("*"),
      ]);
      if (u.error) throw u.error;
      if (p.error) throw p.error;
      return { universities: u.data, programs: p.data };
    },
  });

  const cities = useMemo(
    () => Array.from(new Set((data?.universities ?? []).map((u) => u.city))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.universities
      .map((u) => ({
        university: u,
        programs: data.programs.filter(
          (p) =>
            p.university_id === u.id &&
            (degree === "all" || p.degree === degree) &&
            (language === "all" || p.language === language),
        ),
      }))
      .filter(({ university, programs }) => {
        if (city !== "all" && university.city !== city) return false;
        if (programs.length === 0) return false;
        if (q.trim()) {
          const needle = q.trim().toLowerCase();
          const hit =
            university.name.toLowerCase().includes(needle) ||
            university.city.toLowerCase().includes(needle) ||
            programs.some((p) => p.name_fr.toLowerCase().includes(needle));
          if (!hit) return false;
        }
        return true;
      });
  }, [data, city, degree, language, q]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Universités & programmes</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Comparez le tarif officiel et le tarif négocié par notre agence, puis postulez en un clic.
        </p>

        <div className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Université ou filière" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Niveau d'études</Label>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {(["ASSOCIATE", "BACHELORS", "MASTERS", "PHD"] as DegreeLevel[]).map((d) => (
                  <SelectItem key={d} value={d}>{fr.degree[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Langue d'enseignement</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les langues</SelectItem>
                {(["ENGLISH", "TURKISH", "FRENCH"] as ProgLanguage[]).map((l) => (
                  <SelectItem key={l} value={l}>{fr.language[l]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-muted-foreground">Aucun résultat pour ces filtres.</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {filtered.map(({ university, programs }) => (
              <Card key={university.id} className="shadow-card">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{university.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {university.city} · {university.type === "PUBLIC" ? "Publique" : "Privée"}
                      </p>
                    </div>
                    {university.has_agency_discount && (
                      <Badge className="bg-success-soft text-success">Remise agence</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{university.description_fr}</p>
                  {university.discount_details && (
                    <p className="text-sm font-medium text-success">{university.discount_details}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {programs.map((p) => (
                    <div key={p.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{p.name_fr}</p>
                          <p className="text-xs text-muted-foreground">
                            {fr.degree[p.degree]} · {fr.language[p.language]} · {p.duration_years} ans
                          </p>
                        </div>
                        <div className="text-right">
                          {p.discounted_agency_fee_usd ? (
                            <>
                              <p className="text-xs text-muted-foreground line-through">
                                {formatMoney(Number(p.tuition_fee_usd))} / an
                              </p>
                              <p className="font-semibold text-success">
                                {formatMoney(Number(p.discounted_agency_fee_usd))} / an
                              </p>
                            </>
                          ) : (
                            <p className="font-semibold">{formatMoney(Number(p.tuition_fee_usd))} / an</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" className="mt-3 w-full" asChild>
                        <Link to="/register" search={{ major: p.name_fr, source: "Catalogue_Web" }}>
                          Postuler pour cette filière
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {university.website_url && (
                    <a
                      className="inline-flex items-center gap-1 text-sm text-primary underline"
                      href={university.website_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Sparkles className="size-3.5" /> Site officiel
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div id="budget" className="mt-16 scroll-mt-20">
          <BudgetCalculator />
        </div>
      </div>
      <WhatsAppButton />
    </div>
  );
}
