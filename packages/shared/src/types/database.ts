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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      asc_connections: {
        Row: {
          id: string
          user_id: string
          key_id: string
          issuer_id: string
          encrypted_private_key: string
          encryption_iv: string
          selected_app_id: string | null
          selected_app_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key_id: string
          issuer_id: string
          encrypted_private_key: string
          encryption_iv: string
          selected_app_id?: string | null
          selected_app_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key_id?: string
          issuer_id?: string
          encrypted_private_key?: string
          encryption_iv?: string
          selected_app_id?: string | null
          selected_app_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asc_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          hard_rules_completed: boolean
          id: string
          max_attempts: number
          priority: number
          report_generated: boolean
          soft_rules_completed: boolean
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          submission_id: string
          worker_id: string | null
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          hard_rules_completed?: boolean
          id?: string
          max_attempts?: number
          priority?: number
          report_generated?: boolean
          soft_rules_completed?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          submission_id: string
          worker_id?: string | null
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          hard_rules_completed?: boolean
          id?: string
          max_attempts?: number
          priority?: number
          report_generated?: boolean
          soft_rules_completed?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          submission_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credits: number | null
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits?: number | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pattern_feedback: {
        Row: {
          id: string
          pattern_id: string
          report_item_id: string | null
          user_id: string
          was_helpful: boolean
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pattern_id: string
          report_item_id?: string | null
          user_id: string
          was_helpful: boolean
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pattern_id?: string
          report_item_id?: string | null
          user_id?: string
          was_helpful?: boolean
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_feedback_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "rejection_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_feedback_report_item_id_fkey"
            columns: ["report_item_id"]
            isOneToOne: false
            referencedRelation: "report_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rejection_patterns: {
        Row: {
          id: string
          guideline: string
          category: string
          title: string
          trigger_description: string
          fix_suggestion: string
          match_categories: string[]
          match_keywords: string[]
          match_features_required: string[]
          match_features_absent: string[]
          match_min_matches: number
          base_confidence: number
          calibrated_confidence: number | null
          total_matches: number
          source: string | null
          source_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          guideline: string
          category: string
          title: string
          trigger_description: string
          fix_suggestion: string
          match_categories?: string[]
          match_keywords?: string[]
          match_features_required?: string[]
          match_features_absent?: string[]
          match_min_matches?: number
          base_confidence?: number
          calibrated_confidence?: number | null
          total_matches?: number
          source?: string | null
          source_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guideline?: string
          category?: string
          title?: string
          trigger_description?: string
          fix_suggestion?: string
          match_categories?: string[]
          match_keywords?: string[]
          match_features_required?: string[]
          match_features_absent?: string[]
          match_min_matches?: number
          base_confidence?: number
          calibrated_confidence?: number | null
          total_matches?: number
          source?: string | null
          source_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_items: {
        Row: {
          category: Database["public"]["Enums"]["check_category"]
          confidence: number | null
          created_at: string
          description: string
          fix_suggestion: string | null
          guideline_ref: string | null
          id: string
          pattern_id: string | null
          report_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
          user_feedback: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["check_category"]
          confidence?: number | null
          created_at?: string
          description: string
          fix_suggestion?: string | null
          guideline_ref?: string | null
          id?: string
          pattern_id?: string | null
          report_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
          user_feedback?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["check_category"]
          confidence?: number | null
          created_at?: string
          description?: string
          fix_suggestion?: string | null
          guideline_ref?: string | null
          id?: string
          pattern_id?: string | null
          report_id?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          title?: string
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_items_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "rejection_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          score_content: number | null
          score_ipa_binary: number | null
          score_metadata: number | null
          score_overall: number | null
          score_plist: number | null
          score_privacy: number | null
          score_screenshots: number | null
          score_urls: number | null
          submission_id: string
          summary: string | null
          total_critical: number
          total_info: number
          total_pass: number
          total_warnings: number
        }
        Insert: {
          created_at?: string
          id?: string
          score_content?: number | null
          score_ipa_binary?: number | null
          score_metadata?: number | null
          score_overall?: number | null
          score_plist?: number | null
          score_privacy?: number | null
          score_screenshots?: number | null
          score_urls?: number | null
          submission_id: string
          summary?: string | null
          total_critical?: number
          total_info?: number
          total_pass?: number
          total_warnings?: number
        }
        Update: {
          created_at?: string
          id?: string
          score_content?: number | null
          score_ipa_binary?: number | null
          score_metadata?: number | null
          score_overall?: number | null
          score_plist?: number | null
          score_privacy?: number | null
          score_screenshots?: number | null
          score_urls?: number | null
          submission_id?: string
          summary?: string | null
          total_critical?: number
          total_info?: number
          total_pass?: number
          total_warnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          age_rating: string | null
          age_rating_answers: string | null
          amount_paid: number | null
          app_icon_path: string | null
          app_name: string
          category: string | null
          completed_at: string | null
          contextual_permissions: boolean | null
          copyright: string | null
          created_at: string
          credits_used: number | null
          data_collection: string | null
          demo_password: string | null
          demo_username: string | null
          description: string | null
          generates_ai_content: boolean | null
          has_account_deletion: boolean | null
          has_ads: boolean | null
          has_ai_content_filtering: boolean | null
          has_alternate_icons: boolean | null
          has_health_disclaimers: boolean | null
          has_iap: boolean | null
          has_restore_purchases: boolean | null
          has_subscriptions: boolean | null
          has_third_party_login: boolean | null
          has_ugc: boolean | null
          has_ugc_moderation: boolean | null
          id: string
          ipa_path: string | null
          is_new_app: boolean | null
          is_rereviewing: boolean | null
          keywords: string | null
          makes_health_claims: boolean | null
          manifest_path: string | null
          marketing_url: string | null
          original_submission_id: string | null
          paid_at: string | null
          paywall_screenshot_index: number | null
          plist_path: string | null
          privacy_url: string | null
          promotional_text: string | null
          review_notes: string | null
          review_type: Database["public"]["Enums"]["review_type"]
          reviewer_contact: string | null
          screenshot_paths: string[] | null
          screenshots_match_ui: boolean | null
          secondary_category: string | null
          sells_digital_outside_iap: boolean | null
          settings_screenshot_index: number | null
          sign_in_required: boolean | null
          status: Database["public"]["Enums"]["submission_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subscription_terms_on_paywall: boolean | null
          subscriptions_without_login: boolean | null
          subtitle: string | null
          support_url: string | null
          tested_ipv6: boolean | null
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          age_rating?: string | null
          age_rating_answers?: string | null
          amount_paid?: number | null
          app_icon_path?: string | null
          app_name: string
          category?: string | null
          completed_at?: string | null
          contextual_permissions?: boolean | null
          copyright?: string | null
          created_at?: string
          credits_used?: number | null
          data_collection?: string | null
          demo_password?: string | null
          demo_username?: string | null
          description?: string | null
          generates_ai_content?: boolean | null
          has_account_deletion?: boolean | null
          has_ads?: boolean | null
          has_ai_content_filtering?: boolean | null
          has_alternate_icons?: boolean | null
          has_health_disclaimers?: boolean | null
          has_iap?: boolean | null
          has_restore_purchases?: boolean | null
          has_subscriptions?: boolean | null
          has_third_party_login?: boolean | null
          has_ugc?: boolean | null
          has_ugc_moderation?: boolean | null
          id?: string
          ipa_path?: string | null
          is_new_app?: boolean | null
          is_rereviewing?: boolean | null
          keywords?: string | null
          makes_health_claims?: boolean | null
          manifest_path?: string | null
          marketing_url?: string | null
          original_submission_id?: string | null
          paid_at?: string | null
          paywall_screenshot_index?: number | null
          plist_path?: string | null
          privacy_url?: string | null
          promotional_text?: string | null
          review_notes?: string | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewer_contact?: string | null
          screenshot_paths?: string[] | null
          screenshots_match_ui?: boolean | null
          secondary_category?: string | null
          sells_digital_outside_iap?: boolean | null
          settings_screenshot_index?: number | null
          sign_in_required?: boolean | null
          status?: Database["public"]["Enums"]["submission_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subscription_terms_on_paywall?: boolean | null
          subscriptions_without_login?: boolean | null
          subtitle?: string | null
          support_url?: string | null
          tested_ipv6?: boolean | null
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          age_rating?: string | null
          age_rating_answers?: string | null
          amount_paid?: number | null
          app_icon_path?: string | null
          app_name?: string
          category?: string | null
          completed_at?: string | null
          contextual_permissions?: boolean | null
          copyright?: string | null
          created_at?: string
          credits_used?: number | null
          data_collection?: string | null
          demo_password?: string | null
          demo_username?: string | null
          description?: string | null
          generates_ai_content?: boolean | null
          has_account_deletion?: boolean | null
          has_ads?: boolean | null
          has_ai_content_filtering?: boolean | null
          has_alternate_icons?: boolean | null
          has_health_disclaimers?: boolean | null
          has_iap?: boolean | null
          has_restore_purchases?: boolean | null
          has_subscriptions?: boolean | null
          has_third_party_login?: boolean | null
          has_ugc?: boolean | null
          has_ugc_moderation?: boolean | null
          id?: string
          ipa_path?: string | null
          is_new_app?: boolean | null
          is_rereviewing?: boolean | null
          keywords?: string | null
          makes_health_claims?: boolean | null
          manifest_path?: string | null
          marketing_url?: string | null
          original_submission_id?: string | null
          paid_at?: string | null
          paywall_screenshot_index?: number | null
          plist_path?: string | null
          privacy_url?: string | null
          promotional_text?: string | null
          review_notes?: string | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewer_contact?: string | null
          screenshot_paths?: string[] | null
          screenshots_match_ui?: boolean | null
          secondary_category?: string | null
          sells_digital_outside_iap?: boolean | null
          settings_screenshot_index?: number | null
          sign_in_required?: boolean | null
          status?: Database["public"]["Enums"]["submission_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subscription_terms_on_paywall?: boolean | null
          subscriptions_without_login?: boolean | null
          subtitle?: string | null
          support_url?: string | null
          tested_ipv6?: boolean | null
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_original_submission_id_fkey"
            columns: ["original_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      check_category:
        | "metadata"
        | "screenshots"
        | "privacy_manifest"
        | "info_plist"
        | "urls"
        | "content_policy"
        | "description"
        | "metadata_quality"
        | "ipa_binary"
      job_status: "pending" | "running" | "completed" | "failed" | "retrying"
      review_type: "quick" | "full"
      severity_level: "critical" | "warning" | "info" | "pass"
      submission_status:
        | "draft"
        | "paid"
        | "queued"
        | "analyzing"
        | "complete"
        | "failed"
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
      check_category: [
        "metadata",
        "screenshots",
        "privacy_manifest",
        "info_plist",
        "urls",
        "content_policy",
        "description",
        "metadata_quality",
        "ipa_binary",
      ],
      job_status: ["pending", "running", "completed", "failed", "retrying"],
      review_type: ["quick", "full"],
      severity_level: ["critical", "warning", "info", "pass"],
      submission_status: [
        "draft",
        "paid",
        "queued",
        "analyzing",
        "complete",
        "failed",
      ],
    },
  },
} as const
