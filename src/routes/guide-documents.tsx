import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, MapPin, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { supabase } from "@/integrations/supabase/client";
import { fr, type DocType } from "@/lib/domain";

export const Route = createFileRoute("/guide-documents")({
  head: () => ({
    meta: [
      { title: "Guide des documents pour étudier en Türkiye" },
      {
        name: "description",
        content:
          "Baccalauréat, Denklik, casier judiciaire, traductions assermentées : où les obtenir en Afrique de l'Ouest et en combien de temps.",
      },
      { property: "og:title", content: "Guide des documents — Études en Türkiye" },
      {
        property: "og:description",
        content: "Chaque pièce expliquée en français, avec les délais et les pièges à éviter.",
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["document-guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_guides")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Guide des documents</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Chaque pièce du dossier expliquée en français : à quoi elle sert, où l'obtenir en Afrique
          de l'Ouest, le délai moyen et les motifs de rejet les plus fréquents.
        </p>

        {isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((g) => (
              <Card key={g.id} className="flex flex-col shadow-card">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{g.title_fr}</CardTitle>
                    {g.is_required_for_visa && (
                      <Badge className="bg-warning-soft text-warning-foreground">Requis visa</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{g.description_fr}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                  <div>
                    <p className="font-semibold">Comment l'obtenir</p>
                    <p className="text-muted-foreground">{g.acquisition_steps_fr}</p>
                  </div>
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-muted-foreground">{g.where_to_get_it_fr}</p>
                  </div>
                  {g.common_rejections_fr && (
                    <div className="flex gap-2 rounded-lg bg-warning-soft p-3">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                      <p className="text-warning-foreground">{g.common_rejections_fr}</p>
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> ~{g.estimated_days} jours
                    </span>
                    <Button size="sm" asChild>
                      <Link to="/dashboard" hash={`doc-${g.document_type}`}>
                        <Upload className="size-4" /> Téléverser
                      </Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type : {fr.docType[g.document_type as DocType]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <WhatsAppButton />
    </div>
  );
}
