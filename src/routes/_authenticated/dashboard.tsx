import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-auth";
import {
  DOC_TYPES,
  PIPELINE_STEPS,
  fr,
  formatMoney,
  pipelineIndex,
  type DocType,
  type DocumentRow,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mon espace étudiant — SahelTürkiye" },
      { name: "description", content: "Suivez votre dossier, vos documents et votre visa étudiant." },
      { property: "og:title", content: "Mon espace étudiant — SahelTürkiye" },
      { property: "og:description", content: "Suivi de dossier et de documents en temps réel." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isStaff, role } = useRole();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<DocType | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const profileQuery = useQuery({
    queryKey: ["my-student-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const student = profileQuery.data;

  const docsQuery = useQuery({
    queryKey: ["my-documents", student?.id],
    enabled: !!student,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("student_id", student!.id)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as DocumentRow[];
    },
  });

  const upload = useMutation({
    mutationFn: async ({ type, file }: { type: DocType; file: File }) => {
      if (!student || !user) throw new Error("Dossier introuvable");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("student-documents").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("documents").insert({
        student_id: student.id,
        type,
        file_url: path,
        uploaded_by: user.id,
        status: "PENDING_REVIEW",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document envoyé. Il sera vérifié par votre conseiller.");
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
    },
    onError: (e: Error) => toast.error("Échec du téléversement : " + e.message),
    onSettled: () => setUploading(null),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-12">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Aucun dossier étudiant associé</h1>
          <p className="mt-3 text-muted-foreground">
            {isStaff || role === "AGENT"
              ? "Votre compte est un compte du personnel."
              : "Complétez votre pré-inscription pour ouvrir votre dossier."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {isStaff && (
              <Button asChild>
                <Link to="/admin">Aller à l'administration</Link>
              </Button>
            )}
            {role === "AGENT" && (
              <Button asChild>
                <Link to="/field-agent">Espace terrain</Link>
              </Button>
            )}
            {!isStaff && role !== "AGENT" && (
              <Button asChild>
                <Link to="/register" search={{ major: undefined, source: undefined }}>
                  Compléter ma pré-inscription
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stepIdx = pipelineIndex(student.app_status, student.visa_status);
  const latestByType = new Map<string, DocumentRow>();
  for (const d of docsQuery.data ?? []) {
    if (!latestByType.has(d.type)) latestByType.set(d.type, d);
  }

  const passportSoon =
    student.passport_expiry_date &&
    new Date(student.passport_expiry_date).getTime() - Date.now() < 365 * 24 * 3600 * 1000;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div>
          <h1 className="text-3xl font-bold">
            Bonjour {student.first_name} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            {fr.appStatus[student.app_status]} · Visa : {fr.visaStatus[student.visa_status]}
          </p>
        </div>

        {passportSoon && (
          <div className="flex gap-3 rounded-xl bg-warning-soft p-4 text-warning-foreground">
            <AlertCircle className="size-5 shrink-0" />
            <p className="text-sm">
              Votre passeport expire dans moins de 12 mois. Renouvelez-le avant de déposer votre
              demande de visa.
            </p>
          </div>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Suivi de votre parcours</CardTitle>
            <CardDescription>Statut mis à jour par votre conseiller (lecture seule).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={step.label} className="flex flex-1 items-start gap-3 md:block">
                  <div className="flex items-center gap-2 md:mb-2">
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                        i < stepIdx
                          ? "bg-success text-success-foreground"
                          : i === stepIdx
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div
                      className={cn(
                        "hidden h-1 flex-1 rounded-full md:block",
                        i < stepIdx ? "bg-success" : "bg-muted",
                      )}
                    />
                  </div>
                  <p className={cn("text-sm", i <= stepIdx ? "font-semibold" : "text-muted-foreground")}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Ma liste de documents</CardTitle>
              <CardDescription>
                Téléversez chaque pièce. Un document refusé doit être renvoyé corrigé.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DOC_TYPES.map((type) => {
                const doc = latestByType.get(type);
                return (
                  <div
                    key={type}
                    id={`doc-${type}`}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 scroll-mt-24"
                  >
                    <div className="min-w-40 flex-1">
                      <p className="font-medium">{fr.docType[type]}</p>
                      {doc?.status === "REJECTED" && doc.rejection_reason && (
                        <p className="mt-1 text-sm text-destructive">
                          Motif du refus : {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                    {doc ? (
                      <Badge
                        className={cn(
                          doc.status === "APPROVED" && "bg-success-soft text-success",
                          doc.status === "PENDING_REVIEW" && "bg-warning-soft text-warning-foreground",
                          doc.status === "REJECTED" && "bg-destructive/10 text-destructive",
                        )}
                      >
                        {doc.status === "APPROVED" ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : doc.status === "PENDING_REVIEW" ? (
                          <Clock className="size-3.5" />
                        ) : (
                          <AlertCircle className="size-3.5" />
                        )}
                        {fr.docStatus[doc.status]}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Non fourni</Badge>
                    )}
                    <input
                      ref={(el) => {
                        inputRefs.current[type] = el;
                      }}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(type);
                        upload.mutate({ type, file });
                        e.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      variant={doc?.status === "REJECTED" ? "destructive" : "secondary"}
                      disabled={uploading === type}
                      onClick={() => inputRefs.current[type]?.click()}
                    >
                      <Upload className="size-4" />
                      {uploading === type
                        ? "Envoi..."
                        : doc?.status === "REJECTED"
                          ? "Renvoyer"
                          : "Téléverser"}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Mes frais d'agence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span>Statut</span>
                  <span className="font-medium">{fr.feeStatus[student.agency_fee_status]}</span>
                </p>
                <p className="flex justify-between">
                  <span>Payé</span>
                  <span className="font-medium">
                    {formatMoney(Number(student.paid_fee_amount), student.currency)}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Total</span>
                  <span className="font-medium">
                    {formatMoney(Number(student.total_fee_amount), student.currency)}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Besoin d'aide ?</CardTitle>
                <CardDescription>
                  Consultez le guide des documents ou contactez votre conseiller sur WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full" asChild>
                  <Link to="/guide-documents">Guide des documents</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <WhatsAppButton />
    </div>
  );
}
