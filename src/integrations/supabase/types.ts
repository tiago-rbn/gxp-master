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
      audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          change_type: string | null
          company_id: string
          created_at: string
          description: string | null
          gxp_impact: boolean | null
          id: string
          implemented_at: string | null
          priority: Database["public"]["Enums"]["risk_level"] | null
          requester_id: string | null
          status: Database["public"]["Enums"]["status_type"] | null
          system_id: string | null
          title: string
          updated_at: string
          validation_required: boolean | null
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          change_type?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          gxp_impact?: boolean | null
          id?: string
          implemented_at?: string | null
          priority?: Database["public"]["Enums"]["risk_level"] | null
          requester_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          title: string
          updated_at?: string
          validation_required?: boolean | null
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          change_type?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          gxp_impact?: boolean | null
          id?: string
          implemented_at?: string | null
          priority?: Database["public"]["Enums"]["risk_level"] | null
          requester_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          title?: string
          updated_at?: string
          validation_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          change_summary: string | null
          company_id: string
          content: string | null
          created_at: string
          created_by: string | null
          document_id: string
          file_url: string | null
          id: string
          title: string
          version: string
        }
        Insert: {
          change_summary?: string | null
          company_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          document_id: string
          file_url?: string | null
          id?: string
          title: string
          version: string
        }
        Update: {
          change_summary?: string | null
          company_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string
          file_url?: string | null
          id?: string
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string | null
          company_id: string
          content: string | null
          created_at: string
          document_type: string
          file_url: string | null
          id: string
          project_id: string | null
          status: Database["public"]["Enums"]["status_type"] | null
          system_id: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          company_id: string
          content?: string | null
          created_at?: string
          document_type: string
          file_url?: string | null
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          company_id?: string
          content?: string | null
          created_at?: string
          document_type?: string
          file_url?: string | null
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "validation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions_matrix: {
        Row: {
          admin_access: boolean | null
          company_id: string
          created_at: string
          id: string
          module: string
          reader_access: boolean | null
          responsible_access: boolean | null
          updated_at: string
          validator_access: boolean | null
        }
        Insert: {
          admin_access?: boolean | null
          company_id: string
          created_at?: string
          id?: string
          module: string
          reader_access?: boolean | null
          responsible_access?: boolean | null
          updated_at?: string
          validator_access?: boolean | null
        }
        Update: {
          admin_access?: boolean | null
          company_id?: string
          created_at?: string
          id?: string
          module?: string
          reader_access?: boolean | null
          responsible_access?: boolean | null
          updated_at?: string
          validator_access?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_matrix_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          position: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          code: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: string | null
          project_id: string | null
          source: string | null
          status: string | null
          system_id: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          system_id?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          system_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "validation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          assessment_type: string
          assessor_id: string | null
          company_id: string
          controls: string | null
          created_at: string
          description: string | null
          detectability: number | null
          id: string
          probability: number | null
          residual_risk: Database["public"]["Enums"]["risk_level"] | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          severity: number | null
          status: Database["public"]["Enums"]["status_type"] | null
          system_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assessment_type: string
          assessor_id?: string | null
          company_id: string
          controls?: string | null
          created_at?: string
          description?: string | null
          detectability?: number | null
          id?: string
          probability?: number | null
          residual_risk?: Database["public"]["Enums"]["risk_level"] | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          severity?: number | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          assessor_id?: string | null
          company_id?: string
          controls?: string | null
          created_at?: string
          description?: string | null
          detectability?: number | null
          id?: string
          probability?: number | null
          residual_risk?: Database["public"]["Enums"]["risk_level"] | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          severity?: number | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      rtm_links: {
        Row: {
          company_id: string
          created_at: string
          id: string
          requirement_id: string
          test_case_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          requirement_id: string
          test_case_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          requirement_id?: string
          test_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rtm_links_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rtm_links_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          bpx_relevant: boolean | null
          company_id: string
          created_at: string
          criticality: Database["public"]["Enums"]["risk_level"] | null
          data_integrity_impact: boolean | null
          description: string | null
          gamp_category: Database["public"]["Enums"]["gamp_category"]
          gxp_impact: boolean | null
          id: string
          installation_location: string | null
          last_validation_date: string | null
          name: string
          next_revalidation_date: string | null
          process_owner_id: string | null
          responsible_id: string | null
          system_owner_id: string | null
          updated_at: string
          validation_status:
            | Database["public"]["Enums"]["validation_status"]
            | null
          vendor: string | null
          version: string | null
        }
        Insert: {
          bpx_relevant?: boolean | null
          company_id: string
          created_at?: string
          criticality?: Database["public"]["Enums"]["risk_level"] | null
          data_integrity_impact?: boolean | null
          description?: string | null
          gamp_category: Database["public"]["Enums"]["gamp_category"]
          gxp_impact?: boolean | null
          id?: string
          installation_location?: string | null
          last_validation_date?: string | null
          name: string
          next_revalidation_date?: string | null
          process_owner_id?: string | null
          responsible_id?: string | null
          system_owner_id?: string | null
          updated_at?: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status"]
            | null
          vendor?: string | null
          version?: string | null
        }
        Update: {
          bpx_relevant?: boolean | null
          company_id?: string
          created_at?: string
          criticality?: Database["public"]["Enums"]["risk_level"] | null
          data_integrity_impact?: boolean | null
          description?: string | null
          gamp_category?: Database["public"]["Enums"]["gamp_category"]
          gxp_impact?: boolean | null
          id?: string
          installation_location?: string | null
          last_validation_date?: string | null
          name?: string
          next_revalidation_date?: string | null
          process_owner_id?: string | null
          responsible_id?: string | null
          system_owner_id?: string | null
          updated_at?: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status"]
            | null
          vendor?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "systems_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_process_owner_id_fkey"
            columns: ["process_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_system_owner_id_fkey"
            columns: ["system_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          executed_at: string | null
          executed_by: string | null
          expected_results: string | null
          id: string
          preconditions: string | null
          project_id: string | null
          result: string | null
          status: string | null
          steps: string | null
          system_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          executed_at?: string | null
          executed_by?: string | null
          expected_results?: string | null
          id?: string
          preconditions?: string | null
          project_id?: string | null
          result?: string | null
          status?: string | null
          steps?: string | null
          system_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          executed_at?: string | null
          executed_by?: string | null
          expected_results?: string | null
          id?: string
          preconditions?: string | null
          project_id?: string | null
          result?: string | null
          status?: string | null
          steps?: string | null
          system_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "validation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      validation_projects: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          completion_date: string | null
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          progress: number | null
          project_type: string | null
          rejection_reason: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["status_type"] | null
          system_id: string | null
          target_date: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          completion_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          progress?: number | null
          project_type?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          completion_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          progress?: number | null
          project_type?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          system_id?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_projects_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { _token: string; _user_id: string }
        Returns: boolean
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          company_id: string
          company_name: string
          email: string
          expires_at: string
          id: string
          role: string
          status: string
        }[]
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "validator" | "responsible" | "reader"
      gamp_category: "1" | "3" | "4" | "5"
      risk_level: "low" | "medium" | "high" | "critical"
      status_type:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
      validation_status:
        | "not_started"
        | "in_progress"
        | "validated"
        | "expired"
        | "pending_revalidation"
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
      app_role: ["super_admin", "admin", "validator", "responsible", "reader"],
      gamp_category: ["1", "3", "4", "5"],
      risk_level: ["low", "medium", "high", "critical"],
      status_type: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      validation_status: [
        "not_started",
        "in_progress",
        "validated",
        "expired",
        "pending_revalidation",
      ],
    },
  },
} as const
