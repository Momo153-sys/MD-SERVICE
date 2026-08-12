import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, FileCheck2, GraduationCap, MapPin, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Étudier en Türkiye depuis le Mali, le Sénégal, la Guinée & la Côte d'Ivoire" },
      {
        name: "description",
        content:
          "Accompagnement complet : choix d'université, dossier, Denklik, visa étudiant et budget de vie en Türkiye. Tarifs agence négociés.",
      },
      { property: "og:title", content: "MD SERVICE — Votre parcours d'études en Türkiye" },
      {
        property: "og:description",
        content: "De la pré-inscription au visa : un accompagnement 100% francophone.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  { icon: FileCheck2, title: "1. Pré-inscription", text: "Créez votre dossier en 5 minutes et recevez votre conseiller dédié." },
  { icon: BadgeCheck, title: "2. Documents & Denklik", text: "Nous vérifions chaque pièce : baccalauréat, traductions, casier judiciaire." },
  { icon: GraduationCap, title: "3. Admission", text: "Dépôt du dossier auprès des universités partenaires et lettre d'acceptation." },
  { icon: MapPin, title: "4. Visa & arrivée", text: "Rendez-vous consulaire, visa étudiant et installation à Istanbul, Ankara ou Izmir." },
];

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="hero-gradient text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Mali · Sénégal · Guinée · Côte d'Ivoire
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Étudiez en Türkiye, accompagné du premier document jusqu'à l'aéroport.
            </h1>
            <p className="mt-5 max-w-xl text-base opacity-90">
              Notre agence gère votre dossier universitaire, vos traductions assermentées, votre
              Denklik et votre visa étudiant — entièrement en français.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register" search={{ major: undefined, source: undefined }} >
                  Démarrer mon dossier <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent hover:bg-white/10"
                asChild
              >
                <Link to="/universities">Voir les universités & le budget</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-display text-2xl font-bold">-25%</p>
                <p className="opacity-80">de frais de scolarité négociés</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">6</p>
                <p className="opacity-80">universités partenaires</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">100%</p>
                <p className="opacity-80">suivi francophone</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 self-center">
            {steps.map((s) => (
              <div key={s.title} className="flex gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur">
                <s.icon className="mt-1 size-6 shrink-0" />
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm opacity-85">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl font-bold">Tout ce dont vous avez besoin, au même endroit</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="space-y-3 p-6">
              <FileCheck2 className="size-7 text-primary" />
              <h3 className="text-lg font-semibold">Guide des documents</h3>
              <p className="text-sm text-muted-foreground">
                Où obtenir chaque pièce à Bamako, Dakar, Conakry ou Abidjan, les délais et les
                erreurs qui font rejeter un dossier.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link to="/guide-documents">Consulter le guide</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="space-y-3 p-6">
              <GraduationCap className="size-7 text-primary" />
              <h3 className="text-lg font-semibold">Catalogue d'universités</h3>
              <p className="text-sm text-muted-foreground">
                Filtrez par ville, niveau et langue d'enseignement, et comparez le tarif officiel au
                tarif agence.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link to="/universities">Explorer le catalogue</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="space-y-3 p-6">
              <Wallet className="size-7 text-primary" />
              <h3 className="text-lg font-semibold">Calculateur de budget</h3>
              <p className="text-sm text-muted-foreground">
                Loyer, nourriture, transport : estimez votre budget mensuel réel et découvrez les
                économies en colocation.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link to="/universities" hash="budget">
                  Calculer mon budget
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MD SERVICE — Agence d'orientation vers les universités turques.
      </footer>
      <WhatsAppButton />
    </div>
  );
}
