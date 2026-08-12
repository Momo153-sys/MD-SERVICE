export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          performed_by_user_id: string | null
          student_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by_user_id?: string | null
          student_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by_user_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      city_living_costs: {
        Row: {
          city_name: string
          groceries_usd: number
          id: string
          private_dorm_usd: number
          shared_2bed_rent_usd: number
          shared_3bed_rent_usd: number
          studio_rent_usd: number
          transport_student_usd: number
          utilities_usd: number
        }
        Insert: {
          city_name: string
          groceries_usd?: number
          id?: string
          private_dorm_usd?: number
          shared_2bed_rent_usd?: number
          shared_3bed_rent_usd?: number
          studio_rent_usd?: number
          transport_student_usd?: number
          utilities_usd?: number
        }
        Update: {
          city_name?: string
          groceries_usd?: number
          id?: string
          private_dorm_usd?: number
          shared_2bed_rent_usd?: number
          shared_3bed_rent_usd?: number
          studio_rent_usd?: number
          transport_student_usd?: number
          utilities_usd?: number
        }
        Relationships: []
      }
      document_guides: {
        Row: {
          acquisition_steps_fr: string | null
          common_rejections_fr: string | null
          description_fr: string | null
          document_type: Database["public"]["Enums"]["doc_type"]
          estimated_days: number
          id: string
          is_required_for_visa: boolean
          sample_image_url: string | null
          sort_order: number
          title_fr: string
          where_to_get_it_fr: string | null
        }
        Insert: {
          acquisition_steps_fr?: string | null
          common_rejections_fr?: string | null
          description_fr?: string | null
          document_type: Database["public"]["Enums"]["doc_type"]
          estimated_days?: number
          id?: string
          is_required_for_visa?: boolean
          sample_image_url?: string | null
          sort_order?: number
          title_fr: string
          where_to_get_it_fr?: string | null
        }
        Update: {
          acquisition_steps_fr?: string | null
          common_rejections_fr?: string | null
          description_fr?: string | null
          document_type?: Database["public"]["Enums"]["doc_type"]
          estimated_days?: number
          id?: string
          is_required_for_visa?: boolean
          sample_image_url?: string | null
          sort_order?: number
          title_fr?: string
          where_to_get_it_fr?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          file_url: string
          id: string
          rejection_reason: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["doc_status"]
          student_id: string
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          student_id: string
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          student_id?: string
          type?: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          currency: string
          id: string
          kind: string
          method: string
          note: string | null
          paid_at: string
          recorded_by: string | null
          reference: string | null
          student_id: string
        }
        Insert: {
          amount: number
          currency?: string
          id?: string
          kind?: string
          method?: string
          note?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          kind?: string
          method?: string
          note?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          degree: Database["public"]["Enums"]["degree_level"]
          discounted_agency_fee_usd: number | null
          duration_years: number
          id: string
          language: Database["public"]["Enums"]["prog_language"]
          name_en: string | null
          name_fr: string
          tuition_fee_usd: number
          university_id: string
        }
        Insert: {
          created_at?: string
          degree?: Database["public"]["Enums"]["degree_level"]
          discounted_agency_fee_usd?: number | null
          duration_years?: number
          id?: string
          language?: Database["public"]["Enums"]["prog_language"]
          name_en?: string | null
          name_fr: string
          tuition_fee_usd?: number
          university_id: string
        }
        Update: {
          created_at?: string
          degree?: Database["public"]["Enums"]["degree_level"]
          discounted_agency_fee_usd?: number | null
          duration_years?: number
          id?: string
          language?: Database["public"]["Enums"]["prog_language"]
          name_en?: string | null
          name_fr?: string
          tuition_fee_usd?: number
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          agency_fee_status: Database["public"]["Enums"]["fee_status"]
          app_status: Database["public"]["Enums"]["app_status"]
          assigned_counselor_id: string | null
          country_of_origin: string
          created_at: string
          created_by: string | null
          currency: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_source: string | null
          notes: string | null
          paid_fee_amount: number
          passport_expiry_date: string | null
          passport_number: string | null
          phone: string | null
          preferred_major: string | null
          target_degree: Database["public"]["Enums"]["degree_level"] | null
          target_university_id: string | null
          total_fee_amount: number
          updated_at: string
          user_id: string | null
          visa_status: Database["public"]["Enums"]["visa_status"]
        }
        Insert: {
          agency_fee_status?: Database["public"]["Enums"]["fee_status"]
          app_status?: Database["public"]["Enums"]["app_status"]
          assigned_counselor_id?: string | null
          country_of_origin?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_source?: string | null
          notes?: string | null
          paid_fee_amount?: number
          passport_expiry_date?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_major?: string | null
          target_degree?: Database["public"]["Enums"]["degree_level"] | null
          target_university_id?: string | null
          total_fee_amount?: number
          updated_at?: string
          user_id?: string | null
          visa_status?: Database["public"]["Enums"]["visa_status"]
        }
        Update: {
          agency_fee_status?: Database["public"]["Enums"]["fee_status"]
          app_status?: Database["public"]["Enums"]["app_status"]
          assigned_counselor_id?: string | null
          country_of_origin?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_source?: string | null
          notes?: string | null
          paid_fee_amount?: number
          passport_expiry_date?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_major?: string | null
          target_degree?: Database["public"]["Enums"]["degree_level"] | null
          target_university_id?: string | null
          total_fee_amount?: number
          updated_at?: string
          user_id?: string | null
          visa_status?: Database["public"]["Enums"]["visa_status"]
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_target_university_id_fkey"
            columns: ["target_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          city: string
          created_at: string
          description_fr: string | null
          discount_details: string | null
          has_agency_discount: boolean
          id: string
          logo_url: string | null
          name: string
          type: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city: string
          created_at?: string
          description_fr?: string | null
          discount_details?: string | null
          has_agency_discount?: boolean
          id?: string
          logo_url?: string | null
          name: string
          type?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          description_fr?: string | null
          discount_details?: string | null
          has_agency_discount?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          type?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "STUDENT" | "AGENT" | "COUNSELOR" | "ADMIN"
      app_status:
        | "PRE_REGISTERED"
        | "DOCS_PENDING"
        | "DOCS_APPROVED"
        | "UNIVERSITY_SUBMITTED"
        | "CONDITIONAL_OFFER"
        | "FINAL_OFFER"
        | "REJECTED"
      degree_level: "ASSOCIATE" | "BACHELORS" | "MASTERS" | "PHD"
      doc_status: "PENDING_REVIEW" | "APPROVED" | "REJECTED"
      doc_type:
        | "PASSPORT"
        | "BAC_DIPLOMA"
        | "TRANSCRIPT"
        | "FRENCH_TO_TURKISH_TRANSLATION"
        | "DENKLIK_CERTIFICATE"
        | "CASIER_JUDICIAIRE"
        | "VISA_PHOTO"
        | "ACCEPTANCE_LETTER"
        | "PAYMENT_RECEIPT"
      fee_status: "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID"
      prog_language: "ENGLISH" | "TURKISH" | "FRENCH"
      visa_status:
        | "NOT_STARTED"
        | "DOCUMENTS_PREPARING"
        | "APPOINTMENT_SCHEDULED"
        | "VISA_SUBMITTED"
        | "VISA_APPROVED"
        | "VISA_REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["STUDENT", "AGENT", "COUNSELOR", "ADMIN"],
      app_status: [
        "PRE_REGISTERED",
        "DOCS_PENDING",
        "DOCS_APPROVED",
        "UNIVERSITY_SUBMITTED",
        "CONDITIONAL_OFFER",
        "FINAL_OFFER",
        "REJECTED",
      ],
      degree_level: ["ASSOCIATE", "BACHELORS", "MASTERS", "PHD"],
      doc_status: ["PENDING_REVIEW", "APPROVED", "REJECTED"],
      doc_type: [
        "PASSPORT",
        "BAC_DIPLOMA",
        "TRANSCRIPT",
        "FRENCH_TO_TURKISH_TRANSLATION",
        "DENKLIK_CERTIFICATE",
        "CASIER_JUDICIAIRE",
        "VISA_PHOTO",
        "ACCEPTANCE_LETTER",
        "PAYMENT_RECEIPT",
      ],
      fee_status: ["UNPAID", "PARTIALLY_PAID", "FULLY_PAID"],
      prog_language: ["ENGLISH", "TURKISH", "FRENCH"],
      visa_status: [
        "NOT_STARTED",
        "DOCUMENTS_PREPARING",
        "APPOINTMENT_SCHEDULED",
        "VISA_SUBMITTED",
        "VISA_APPROVED",
        "VISA_REJECTED",
      ],
    },
  },
} as const
