import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { History, ShieldAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-auth";
import {
  APP_STATUSES,
  VISA_STATUSES,
  fr,
  formatMoney,
  type AppStatus,
  type DocumentRow,
  type StudentProfile,
  type VisaStatus,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Administration agence — SahelTürkiye" },
      { name: "description", content: "Pipeline des dossiers, revue documentaire et registre financier." },
      { property: "og:title", content: "Administration agence — SahelTürkiye" },
      { property: "og:description", content: "Gestion complète des dossiers étudiants." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isStaff, isAdmin, loading, user } = useRole();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<
    | { student: StudentProfile; field: "app_status" | "visa_status"; value: string }
    | null
  >(null);
  const [auditFor, setAuditFor] = useState<StudentProfile | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["admin-students"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StudentProfile[];
    },
  });

  const mutateStatus = useMutation({
    mutationFn: async (p: { id: string; field: "app_status" | "visa_status"; value: string }) => {
      const payload =
        p.field === "app_status"
          ? { app_status: p.value as AppStatus }
          : { visa_status: p.value as VisaStatus };
      const { error } = await supabase.from("student_profiles").update(payload).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: (e: Error) => toast.error("Mise à jour impossible : " + e.message),
  });

  if (loading) return <div className="p-10 text-muted-foreground">Chargement...</div>;

  if (!isStaff) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-muted-foreground">
            Cette section est réservée aux conseillers et administrateurs.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">Retour à mon espace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const students = studentsQuery.data ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-[95rem] space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Administration</h1>
            <p className="text-muted-foreground">{students.length} dossiers étudiants suivis.</p>
          </div>
          {isAdmin && (
            <Button variant="secondary" asChild>
              <Link to="/admin/team">
                <Users className="size-4" /> Gestion de l'équipe
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList className="flex-wrap">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="documents">Revue des documents</TabsTrigger>
            <TabsTrigger value="ledger">Registre financier</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-8">
            <KanbanBoard
              title="Pipeline candidature"
              columns={APP_STATUSES}
              label={(s) => fr.appStatus[s as AppStatus]}
              students={students}
              valueOf={(s) => s.app_status}
              onDrop={(student, value) => setPending({ student, field: "app_status", value })}
              onAudit={setAuditFor}
            />
            <KanbanBoard
              title="Pipeline visa"
              columns={VISA_STATUSES}
              label={(s) => fr.visaStatus[s as VisaStatus]}
              students={students}
              valueOf={(s) => s.visa_status}
              onDrop={(student, value) => setPending({ student, field: "visa_status", value })}
              onAudit={setAuditFor}
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentReview students={students} reviewerId={user?.id ?? null} />
          </TabsContent>

          <TabsContent value="ledger">
            <Ledger students={students} />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  Passer le dossier de {pending.student.first_name} {pending.student.last_name} à «{" "}
                  {pending.field === "app_status"
                    ? fr.appStatus[pending.value as AppStatus]
                    : fr.visaStatus[pending.value as VisaStatus]}{" "}
                  » ? Cette action est enregistrée dans le journal d'audit.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pending) return;
                mutateStatus.mutate({
                  id: pending.student.id,
                  field: pending.field,
                  value: pending.value,
                });
                setPending(null);
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuditDrawer student={auditFor} onClose={() => setAuditFor(null)} />
    </div>
  );
}

function KanbanBoard({
  title,
  columns,
  label,
  students,
  valueOf,
  onDrop,
  onAudit,
}: {
  title: string;
  columns: readonly string[];
  label: (s: string) => string;
  students: StudentProfile[];
  valueOf: (s: StudentProfile) => string;
  onDrop: (student: StudentProfile, value: string) => void;
  onAudit: (s: StudentProfile) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {columns.map((col) => {
          const items = students.filter((s) => valueOf(s) === col);
          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const student = students.find((s) => s.id === dragId);
                if (student && valueOf(student) !== col) onDrop(student, col);
                setDragId(null);
              }}
              className="w-64 shrink-0 rounded-xl border border-border bg-muted/40 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">{label(col)}</p>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((s) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={() => setDragId(s.id)}
                    className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-card active:cursor-grabbing"
                  >
                    <p className="text-sm font-medium">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.country_of_origin} · {s.preferred_major ?? "Filière à définir"}
                    </p>
                    {s.lead_source && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        {s.lead_source}
                      </Badge>
                    )}
                    <button
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline"
                      onClick={() => onAudit(s)}
                    >
                      <History className="size-3" /> Historique
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">Aucun dossier</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DocumentReview({
  students,
  reviewerId,
}: {
  students: StudentProfile[];
  reviewerId: string | null;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const [reason, setReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const docsQuery = useQuery({
    queryKey: ["all-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as DocumentRow[];
    },
  });

  async function openDoc(doc: DocumentRow) {
    setSelected(doc);
    setReason("");
    const { data } = await supabase.storage
      .from("student-documents")
      .createSignedUrl(doc.file_url, 600);
    setPreviewUrl(data?.signedUrl ?? null);
  }

  const review = useMutation({
    mutationFn: async ({ approve }: { approve: boolean }) => {
      if (!selected) return;
      if (!approve && reason.trim().length < 5) {
        throw new Error("Un motif de refus d'au moins 5 caractères est obligatoire.");
      }
      const { error } = await supabase
        .from("documents")
        .update({
          status: approve ? "APPROVED" : "REJECTED",
          rejection_reason: approve ? null : reason.trim(),
          reviewed_by: reviewerId,
        })
        .eq("id", selected.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document traité.");
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nameOf = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.first_name} ${s.last_name}` : "Étudiant";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Documents déposés</CardTitle>
          <CardDescription>Sélectionnez un document pour l'examiner.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(docsQuery.data ?? []).map((d) => (
            <button
              key={d.id}
              onClick={() => openDoc(d)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border border-border p-3 text-left text-sm hover:bg-accent",
                selected?.id === d.id && "border-primary bg-primary-soft",
              )}
            >
              <span>
                <span className="font-medium">{nameOf(d.student_id)}</span>
                <span className="block text-xs text-muted-foreground">{fr.docType[d.type]}</span>
              </span>
              <Badge
                className={cn(
                  d.status === "APPROVED" && "bg-success-soft text-success",
                  d.status === "PENDING_REVIEW" && "bg-warning-soft text-warning-foreground",
                  d.status === "REJECTED" && "bg-destructive/10 text-destructive",
                )}
              >
                {fr.docStatus[d.status]}
              </Badge>
            </button>
          ))}
          {(docsQuery.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun document déposé pour le moment.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Vérification</CardTitle>
          <CardDescription>
            {selected ? fr.docType[selected.type] : "Aucun document sélectionné"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected ? (
            <>
              <div className="h-80 overflow-hidden rounded-lg border border-border bg-muted">
                {previewUrl ? (
                  <iframe src={previewUrl} title="Aperçu du document" className="size-full" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-muted-foreground">
                    Chargement de l'aperçu...
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motif de refus (obligatoire pour refuser)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  maxLength={500}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex : scan illisible, cachet du ministère manquant..."
                />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => review.mutate({ approve: true })}>
                  Approuver
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => review.mutate({ approve: false })}
                >
                  Refuser
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choisissez un document dans la liste de gauche.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Ledger({ students }: { students: StudentProfile[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    student_id: "",
    amount: "",
    currency: "XOF",
    method: "MOBILE_MONEY",
    kind: "AGENCY_FEE",
    reference: "",
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      const amount = Number(form.amount);
      if (!form.student_id || !Number.isFinite(amount) || amount <= 0) {
        throw new Error("Sélectionnez un étudiant et saisissez un montant valide.");
      }
      const { error } = await supabase.from("payments").insert({
        student_id: form.student_id,
        amount,
        currency: form.currency,
        method: form.method,
        kind: form.kind,
        reference: form.reference || null,
      });
      if (error) throw error;

      const student = students.find((s) => s.id === form.student_id);
      if (student && form.kind === "AGENCY_FEE") {
        const paid = Number(student.paid_fee_amount) + amount;
        const total = Number(student.total_fee_amount);
        await supabase
          .from("student_profiles")
          .update({
            paid_fee_amount: paid,
            agency_fee_status: total > 0 && paid >= total ? "FULLY_PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID",
          })
          .eq("id", student.id);
      }
    },
    onSuccess: () => {
      toast.success("Paiement enregistré.");
      setForm((f) => ({ ...f, amount: "", reference: "" }));
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nameOf = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.first_name} ${s.last_name}` : "—";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Enregistrer un paiement</CardTitle>
          <CardDescription>Mobile Money, virement bancaire ou espèces.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Étudiant</Label>
            <Select value={form.student_id} onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["XOF", "USD", "EUR"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Moyen de paiement</Label>
            <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="BANK">Virement bancaire</SelectItem>
                <SelectItem value="CASH">Espèces</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AGENCY_FEE">Frais d'agence</SelectItem>
                <SelectItem value="TUITION_DEPOSIT">Acompte scolarité</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Référence</Label>
            <Input
              value={form.reference}
              maxLength={60}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
          </div>
          <Button className="w-full" onClick={() => addPayment.mutate()}>
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Registre multi-devises</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Étudiant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Moyen</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(paymentsQuery.data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.paid_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{nameOf(p.student_id)}</TableCell>
                  <TableCell>{p.kind === "AGENCY_FEE" ? "Frais d'agence" : "Acompte scolarité"}</TableCell>
                  <TableCell>{p.method === "MOBILE_MONEY" ? "Mobile Money" : p.method === "BANK" ? "Banque" : "Espèces"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(Number(p.amount), p.currency)}
                  </TableCell>
                </TableRow>
              ))}
              {(paymentsQuery.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucun paiement enregistré.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditDrawer({ student, onClose }: { student: StudentProfile | null; onClose: () => void }) {
  const logsQuery = useQuery({
    queryKey: ["audit-logs", student?.id],
    enabled: !!student,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("student_id", student!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Journal d'audit</SheetTitle>
          <SheetDescription>
            {student ? `${student.first_name} ${student.last_name}` : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          {(logsQuery.data ?? []).map((l) => (
            <div key={l.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{l.action}</p>
              <p className="text-muted-foreground">
                {l.old_value} → {l.new_value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(l.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
          {(logsQuery.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun changement enregistré.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
