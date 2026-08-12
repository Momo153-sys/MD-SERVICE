import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AppStatus = Database["public"]["Enums"]["app_status"];
export type VisaStatus = Database["public"]["Enums"]["visa_status"];
export type DocType = Database["public"]["Enums"]["doc_type"];
export type DocStatus = Database["public"]["Enums"]["doc_status"];
export type FeeStatus = Database["public"]["Enums"]["fee_status"];
export type DegreeLevel = Database["public"]["Enums"]["degree_level"];
export type ProgLanguage = Database["public"]["Enums"]["prog_language"];
export type StudentProfile = Database["public"]["Tables"]["student_profiles"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export const APP_STATUSES: AppStatus[] = [
  "PRE_REGISTERED",
  "DOCS_PENDING",
  "DOCS_APPROVED",
  "UNIVERSITY_SUBMITTED",
  "CONDITIONAL_OFFER",
  "FINAL_OFFER",
  "REJECTED",
];

export const VISA_STATUSES: VisaStatus[] = [
  "NOT_STARTED",
  "DOCUMENTS_PREPARING",
  "APPOINTMENT_SCHEDULED",
  "VISA_SUBMITTED",
  "VISA_APPROVED",
  "VISA_REJECTED",
];

export const DOC_TYPES: DocType[] = [
  "PASSPORT",
  "BAC_DIPLOMA",
  "TRANSCRIPT",
  "FRENCH_TO_TURKISH_TRANSLATION",
  "DENKLIK_CERTIFICATE",
  "CASIER_JUDICIAIRE",
  "VISA_PHOTO",
  "ACCEPTANCE_LETTER",
  "PAYMENT_RECEIPT",
];

export const ROLES: AppRole[] = ["STUDENT", "AGENT", "COUNSELOR", "ADMIN"];

export const fr = {
  appStatus: {
    PRE_REGISTERED: "Pré-inscrit",
    DOCS_PENDING: "Documents en attente",
    DOCS_APPROVED: "Documents approuvés",
    UNIVERSITY_SUBMITTED: "Dossier envoyé à l'université",
    CONDITIONAL_OFFER: "Offre conditionnelle",
    FINAL_OFFER: "Offre finale",
    REJECTED: "Rejeté",
  } as Record<AppStatus, string>,
  visaStatus: {
    NOT_STARTED: "Non commencé",
    DOCUMENTS_PREPARING: "Préparation des documents",
    APPOINTMENT_SCHEDULED: "Rendez-vous programmé",
    VISA_SUBMITTED: "Visa déposé",
    VISA_APPROVED: "Visa approuvé",
    VISA_REJECTED: "Visa refusé",
  } as Record<VisaStatus, string>,
  docType: {
    PASSPORT: "Passeport",
    BAC_DIPLOMA: "Diplôme du Baccalauréat",
    TRANSCRIPT: "Relevé de notes",
    FRENCH_TO_TURKISH_TRANSLATION: "Traduction assermentée",
    DENKLIK_CERTIFICATE: "Denklik (équivalence)",
    CASIER_JUDICIAIRE: "Casier judiciaire",
    VISA_PHOTO: "Photo biométrique",
    ACCEPTANCE_LETTER: "Lettre d'acceptation",
    PAYMENT_RECEIPT: "Reçu de paiement",
  } as Record<DocType, string>,
  docStatus: {
    PENDING_REVIEW: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Action requise",
  } as Record<DocStatus, string>,
  feeStatus: {
    UNPAID: "Non payé",
    PARTIALLY_PAID: "Partiellement payé",
    FULLY_PAID: "Intégralement payé",
  } as Record<FeeStatus, string>,
  degree: {
    ASSOCIATE: "Licence courte (2 ans)",
    BACHELORS: "Licence",
    MASTERS: "Master",
    PHD: "Doctorat",
  } as Record<DegreeLevel, string>,
  language: {
    ENGLISH: "Anglais",
    TURKISH: "Turc",
    FRENCH: "Français",
  } as Record<ProgLanguage, string>,
  role: {
    STUDENT: "Étudiant",
    AGENT: "Agent terrain",
    COUNSELOR: "Conseiller",
    ADMIN: "Administrateur",
  } as Record<AppRole, string>,
};

export const PIPELINE_STEPS: { label: string; statuses: AppStatus[] }[] = [
  { label: "Pré-inscription", statuses: ["PRE_REGISTERED"] },
  { label: "Vérification des documents", statuses: ["DOCS_PENDING", "DOCS_APPROVED"] },
  { label: "Dépôt université", statuses: ["UNIVERSITY_SUBMITTED"] },
  { label: "Acceptation", statuses: ["CONDITIONAL_OFFER", "FINAL_OFFER"] },
  { label: "Procédure visa", statuses: [] },
  { label: "Arrivée en Türkiye", statuses: [] },
];

export function pipelineIndex(app: AppStatus, visa: VisaStatus): number {
  if (visa === "VISA_APPROVED") return 5;
  if (visa !== "NOT_STARTED") return 4;
  const idx = PIPELINE_STEPS.findIndex((s) => s.statuses.includes(app));
  return idx < 0 ? 0 : idx;
}

export const WHATSAPP_NUMBER = "905317186438";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Bonjour, j'ai besoin d'aide pour mon dossier d'études en Türkiye.",
)}`;

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
