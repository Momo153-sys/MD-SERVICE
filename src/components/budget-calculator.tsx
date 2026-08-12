import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PiggyBank } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/domain";

type Housing = "STUDIO" | "DORM" | "SHARED_2" | "SHARED_3";

const housingLabels: Record<Housing, string> = {
  STUDIO: "Studio individuel",
  DORM: "Résidence privée (dortoir)",
  SHARED_2: "Colocation à 2",
  SHARED_3: "Colocation à 3",
};

export function BudgetCalculator() {
  const [city, setCity] = useState("Istanbul");
  const [housing, setHousing] = useState<Housing>("SHARED_2");
  const [food, setFood] = useState(185);

  const { data } = useQuery({
    queryKey: ["living-costs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("city_living_costs").select("*").order("city_name");
      if (error) throw error;
      return data;
    },
  });

  const current = useMemo(
    () => (data ?? []).find((c) => c.city_name === city) ?? null,
    [data, city],
  );

  const rent = useMemo(() => {
    if (!current) return 0;
    switch (housing) {
      case "STUDIO":
        return Number(current.studio_rent_usd);
      case "DORM":
        return Number(current.private_dorm_usd);
      case "SHARED_2":
        return Number(current.shared_2bed_rent_usd);
      case "SHARED_3":
        return Number(current.shared_3bed_rent_usd);
    }
  }, [current, housing]);

  const transport = Number(current?.transport_student_usd ?? 0);
  const utilities = housing === "DORM" ? 0 : Number(current?.utilities_usd ?? 0);
  const total = rent + transport + utilities + food;

  const studioTotal = Number(current?.studio_rent_usd ?? 0) + transport + Number(current?.utilities_usd ?? 0) + food;
  const sharedBest = Number(current?.shared_3bed_rent_usd ?? 0) + transport + Number(current?.utilities_usd ?? 0) + food;
  const savings = Math.max(0, studioTotal - sharedBest);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl">Calculateur du coût de la vie étudiante</CardTitle>
        <CardDescription>
          Estimez votre budget mensuel réel en Türkiye selon votre ville et votre type de logement.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Ville</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.city_name}>{c.city_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Type de logement</Label>
            <RadioGroup value={housing} onValueChange={(v) => setHousing(v as Housing)} className="grid gap-2">
              {(Object.keys(housingLabels) as Housing[]).map((h) => (
                <label
                  key={h}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
                >
                  <RadioGroupItem value={h} id={`housing-${h}`} />
                  <span>{housingLabels[h]}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Alimentation / restauration au campus : {formatMoney(food)} / mois</Label>
            <Slider min={150} max={220} step={5} value={[food]} onValueChange={(v) => setFood(v[0] ?? 185)} />
            <p className="text-xs text-muted-foreground">Fourchette habituelle : 150 $ à 220 $ par mois.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border p-5">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span>Loyer ({housingLabels[housing]})</span><span className="font-medium">{formatMoney(rent)}</span></li>
              <li className="flex justify-between"><span>Alimentation</span><span className="font-medium">{formatMoney(food)}</span></li>
              <li className="flex justify-between"><span>Carte de transport étudiant</span><span className="font-medium">{formatMoney(transport)}</span></li>
              <li className="flex justify-between"><span>Charges (eau, électricité, internet)</span><span className="font-medium">{formatMoney(utilities)}</span></li>
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="font-semibold">Budget mensuel total</span>
              <span className="font-display text-3xl font-bold text-primary">{formatMoney(total)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">
              soit {formatMoney(total * 12)} par an
            </p>
          </div>

          <div className="flex gap-3 rounded-xl bg-success-soft p-5">
            <PiggyBank className="mt-0.5 size-6 shrink-0 text-success" />
            <div>
              <p className="font-semibold text-success">Économies en colocation</p>
              <p className="text-sm text-foreground/80">
                En partageant un appartement à 3 plutôt qu'en studio à {city}, vous économisez environ{" "}
                <strong>{formatMoney(savings)} par mois</strong>, soit{" "}
                <strong>{formatMoney(savings * 12)} par an</strong>.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
