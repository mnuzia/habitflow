export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          ip_address: unknown | null
          log_id: string
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          ip_address?: unknown | null
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          ip_address?: unknown | null
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      checkin_portions: {
        Row: {
          client_command_uuid: string
          created_at: string | null
          deleted_at: string | null
          device_id: string | null
          habit_id: string
          local_date: string
          logical_clock: number | null
          note: string | null
          portion_id: string
          server_received_at: string | null
          trash_expires_at: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          client_command_uuid: string
          created_at?: string | null
          deleted_at?: string | null
          device_id?: string | null
          habit_id: string
          local_date: string
          logical_clock?: number | null
          note?: string | null
          portion_id?: string
          server_received_at?: string | null
          trash_expires_at?: string | null
          updated_at?: string | null
          value?: number
        }
        Update: {
          client_command_uuid?: string
          created_at?: string | null
          deleted_at?: string | null
          device_id?: string | null
          habit_id?: string
          local_date?: string
          logical_clock?: number | null
          note?: string | null
          portion_id?: string
          server_received_at?: string | null
          trash_expires_at?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkin_portions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["habit_id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_id: string
          consent_text: string
          consent_type: string
          consent_version: string
          created_at: string | null
          granted: boolean
          granted_at: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          consent_id?: string
          consent_text: string
          consent_type: string
          consent_version: string
          created_at?: string | null
          granted: boolean
          granted_at?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          consent_id?: string
          consent_text?: string
          consent_type?: string
          consent_version?: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      download_links: {
        Row: {
          content_type: string | null
          created_at: string | null
          downloaded_at: string | null
          expires_at: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          link_id: string
          link_token: string
          password_hash: string | null
          request_id: string | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          downloaded_at?: string | null
          expires_at: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          link_id?: string
          link_token: string
          password_hash?: string | null
          request_id?: string | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          downloaded_at?: string | null
          expires_at?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          link_id?: string
          link_token?: string
          password_hash?: string | null
          request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_links_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "dsar_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "download_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dsar_requests: {
        Row: {
          closed_at: string | null
          created_at: string | null
          delivered_at: string | null
          priority: string
          request_details: Json | null
          request_id: string
          request_type: string
          resume_checkpoint: Json | null
          status: string
          throttle_mode: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          priority?: string
          request_details?: Json | null
          request_id?: string
          request_type: string
          resume_checkpoint?: Json | null
          status?: string
          throttle_mode?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          priority?: string
          request_details?: Json | null
          request_id?: string
          request_type?: string
          resume_checkpoint?: Json | null
          status?: string
          throttle_mode?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dsar_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      habit_params: {
        Row: {
          created_at: string | null
          effective_from: string
          effective_until: string | null
          habit_id: string
          param_id: string
          target_value: number | null
          value_max: number | null
          value_min: number | null
        }
        Insert: {
          created_at?: string | null
          effective_from: string
          effective_until?: string | null
          habit_id: string
          param_id?: string
          target_value?: number | null
          value_max?: number | null
          value_min?: number | null
        }
        Update: {
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          habit_id?: string
          param_id?: string
          target_value?: number | null
          value_max?: number | null
          value_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_params_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["habit_id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          frequency_type: string
          habit_id: string
          name: string
          tags: Json | null
          target_value: number | null
          times_per_week: number | null
          trash_expires_at: string | null
          unit_kind: string | null
          updated_at: string | null
          user_id: string
          value_max: number | null
          value_min: number | null
          week_days: number[] | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          frequency_type: string
          habit_id?: string
          name: string
          tags?: Json | null
          target_value?: number | null
          times_per_week?: number | null
          trash_expires_at?: string | null
          unit_kind?: string | null
          updated_at?: string | null
          user_id: string
          value_max?: number | null
          value_min?: number | null
          week_days?: number[] | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          frequency_type?: string
          habit_id?: string
          name?: string
          tags?: Json | null
          target_value?: number | null
          times_per_week?: number | null
          trash_expires_at?: string | null
          unit_kind?: string | null
          updated_at?: string | null
          user_id?: string
          value_max?: number | null
          value_min?: number | null
          week_days?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ics_tokens: {
        Row: {
          created_at: string | null
          last_used_at: string | null
          name: string
          revoked_at: string | null
          token_hash: string
          token_id: string
          token_last8: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          token_hash: string
          token_id?: string
          token_last8: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          token_hash?: string
          token_id?: string
          token_last8?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ics_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          digest_hour: number | null
          enabled: boolean | null
          notification_id: string
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          silent_days: number[] | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          digest_hour?: number | null
          enabled?: boolean | null
          notification_id?: string
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          silent_days?: number[] | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          digest_hour?: number | null
          enabled?: boolean | null
          notification_id?: string
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          silent_days?: number[] | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pat_token_allows: {
        Row: {
          allow_id: string
          allow_type: string
          allow_value: string
          created_at: string | null
          token_id: string
        }
        Insert: {
          allow_id?: string
          allow_type: string
          allow_value: string
          created_at?: string | null
          token_id: string
        }
        Update: {
          allow_id?: string
          allow_type?: string
          allow_value?: string
          created_at?: string | null
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pat_token_allows_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "pat_tokens"
            referencedColumns: ["token_id"]
          },
        ]
      }
      pat_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          token_hash: string
          token_id: string
          token_last8: string
          ttl_hours: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          token_hash: string
          token_id?: string
          token_last8: string
          ttl_hours?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          token_hash?: string
          token_id?: string
          token_last8?: string
          ttl_hours?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pat_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          email: string
          locale: string | null
          scheduled_for_deletion_until: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email: string
          locale?: string | null
          scheduled_for_deletion_until?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          locale?: string | null
          scheduled_for_deletion_until?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          applied_at: string | null
          command_type: string
          command_uuid: string
          created_at: string | null
          device_id: string
          error_message: string | null
          status: string
          sync_id: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          command_type: string
          command_uuid: string
          created_at?: string | null
          device_id: string
          error_message?: string | null
          status: string
          sync_id?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          command_type?: string
          command_uuid?: string
          created_at?: string | null
          device_id?: string
          error_message?: string | null
          status?: string
          sync_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tag_aliases: {
        Row: {
          alias_id: string
          created_at: string | null
          effective_from: string
          new_tag: string
          old_tag: string
        }
        Insert: {
          alias_id?: string
          created_at?: string | null
          effective_from: string
          new_tag: string
          old_tag: string
        }
        Update: {
          alias_id?: string
          created_at?: string | null
          effective_from?: string
          new_tag?: string
          old_tag?: string
        }
        Relationships: []
      }
      tag_catalog: {
        Row: {
          created_at: string | null
          display_name: Json
          name: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          display_name: Json
          name: string
          tag_id?: string
        }
        Update: {
          created_at?: string | null
          display_name?: Json
          name?: string
          tag_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      checkins_daily: {
        Row: {
          completed: number | null
          habit_id: string | null
          last_updated: string | null
          local_date: string | null
          portion_count: number | null
          value_sum: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_portions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["habit_id"]
          },
        ]
      }
    }
    Functions: {
      calculate_local_date: {
        Args: { timestamp_value: string; timezone_value?: string }
        Returns: string
      }
      get_user_timezone: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_habit_completed: {
        Args: { check_date: string; habit_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

