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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          content: Json
          created_at: string | null
          deleted_at: string | null
          dismissed: boolean | null
          generated_at: string | null
          id: string
          insight_type: Database["public"]["Enums"]["insight_type"]
          period_end: string | null
          period_start: string | null
          resolved: boolean | null
          user_id: string
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          content: Json
          created_at?: string | null
          deleted_at?: string | null
          dismissed?: boolean | null
          generated_at?: string | null
          id?: string
          insight_type: Database["public"]["Enums"]["insight_type"]
          period_end?: string | null
          period_start?: string | null
          resolved?: boolean | null
          user_id: string
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          dismissed?: boolean | null
          generated_at?: string | null
          id?: string
          insight_type?: Database["public"]["Enums"]["insight_type"]
          period_end?: string | null
          period_start?: string | null
          resolved?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      ask_kwi_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      cycle_records: {
        Row: {
          clotting_by_day: Json | null
          created_at: string | null
          deleted_at: string | null
          flow_by_day: Json | null
          id: string
          notes: string | null
          period_end: string | null
          period_start: string
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clotting_by_day?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          flow_by_day?: Json | null
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start: string
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clotting_by_day?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          flow_by_day?: Json | null
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          deleted_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date: string
          deleted_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          appointment_date: string | null
          appointment_provider: string | null
          appointment_specialty: string | null
          created_at: string | null
          deleted_at: string | null
          generated_at: string | null
          id: string
          included_sections: Json
          pdf_url: string | null
          period_end: string
          period_start: string
          report_length: string | null
          snapshot_data: Json
          user_id: string
          what_to_discuss: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_provider?: string | null
          appointment_specialty?: string | null
          created_at?: string | null
          deleted_at?: string | null
          generated_at?: string | null
          id?: string
          included_sections: Json
          pdf_url?: string | null
          period_end: string
          period_start: string
          report_length?: string | null
          snapshot_data: Json
          user_id: string
          what_to_discuss?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_provider?: string | null
          appointment_specialty?: string | null
          created_at?: string | null
          deleted_at?: string | null
          generated_at?: string | null
          id?: string
          included_sections?: Json
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          report_length?: string | null
          snapshot_data?: Json
          user_id?: string
          what_to_discuss?: string | null
        }
        Relationships: []
      }
      log_activity: {
        Row: {
          body_after: Database["public"]["Enums"]["body_after"] | null
          body_during: Database["public"]["Enums"]["body_during"] | null
          duration_mins: number | null
          exercise_types: string[] | null
          exercised: Database["public"]["Enums"]["exercise_status"] | null
          intensity: Database["public"]["Enums"]["intensity_level"] | null
          log_id: string
          mind_body_alignment:
            | Database["public"]["Enums"]["mind_body_alignment"]
            | null
          motivation_going_in:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          rest_day_type: Database["public"]["Enums"]["rest_day_type"] | null
        }
        Insert: {
          body_after?: Database["public"]["Enums"]["body_after"] | null
          body_during?: Database["public"]["Enums"]["body_during"] | null
          duration_mins?: number | null
          exercise_types?: string[] | null
          exercised?: Database["public"]["Enums"]["exercise_status"] | null
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          log_id: string
          mind_body_alignment?:
            | Database["public"]["Enums"]["mind_body_alignment"]
            | null
          motivation_going_in?:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          rest_day_type?: Database["public"]["Enums"]["rest_day_type"] | null
        }
        Update: {
          body_after?: Database["public"]["Enums"]["body_after"] | null
          body_during?: Database["public"]["Enums"]["body_during"] | null
          duration_mins?: number | null
          exercise_types?: string[] | null
          exercised?: Database["public"]["Enums"]["exercise_status"] | null
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          log_id?: string
          mind_body_alignment?:
            | Database["public"]["Enums"]["mind_body_alignment"]
            | null
          motivation_going_in?:
            | Database["public"]["Enums"]["motivation_level"]
            | null
          rest_day_type?: Database["public"]["Enums"]["rest_day_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "log_activity_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_appetite: {
        Row: {
          appetite_score: number | null
          bloating: Database["public"]["Enums"]["severity_4"] | null
          cravings: boolean | null
          cravings_detail: string | null
          digestion: Database["public"]["Enums"]["digestion_state"] | null
          log_id: string
          unusual_thirst: boolean | null
        }
        Insert: {
          appetite_score?: number | null
          bloating?: Database["public"]["Enums"]["severity_4"] | null
          cravings?: boolean | null
          cravings_detail?: string | null
          digestion?: Database["public"]["Enums"]["digestion_state"] | null
          log_id: string
          unusual_thirst?: boolean | null
        }
        Update: {
          appetite_score?: number | null
          bloating?: Database["public"]["Enums"]["severity_4"] | null
          cravings?: boolean | null
          cravings_detail?: string | null
          digestion?: Database["public"]["Enums"]["digestion_state"] | null
          log_id?: string
          unusual_thirst?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "log_appetite_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_body: {
        Row: {
          headache: Database["public"]["Enums"]["severity_4"] | null
          headache_location: string | null
          joint_pain: Database["public"]["Enums"]["severity_4"] | null
          joint_pain_areas: string[] | null
          log_id: string
          lower_back_pain: Database["public"]["Enums"]["severity_4"] | null
          morning_stiffness: Database["public"]["Enums"]["severity_4"] | null
          muscle_aches: Database["public"]["Enums"]["severity_4"] | null
          pelvic_pain: Database["public"]["Enums"]["severity_4"] | null
        }
        Insert: {
          headache?: Database["public"]["Enums"]["severity_4"] | null
          headache_location?: string | null
          joint_pain?: Database["public"]["Enums"]["severity_4"] | null
          joint_pain_areas?: string[] | null
          log_id: string
          lower_back_pain?: Database["public"]["Enums"]["severity_4"] | null
          morning_stiffness?: Database["public"]["Enums"]["severity_4"] | null
          muscle_aches?: Database["public"]["Enums"]["severity_4"] | null
          pelvic_pain?: Database["public"]["Enums"]["severity_4"] | null
        }
        Update: {
          headache?: Database["public"]["Enums"]["severity_4"] | null
          headache_location?: string | null
          joint_pain?: Database["public"]["Enums"]["severity_4"] | null
          joint_pain_areas?: string[] | null
          log_id?: string
          lower_back_pain?: Database["public"]["Enums"]["severity_4"] | null
          morning_stiffness?: Database["public"]["Enums"]["severity_4"] | null
          muscle_aches?: Database["public"]["Enums"]["severity_4"] | null
          pelvic_pain?: Database["public"]["Enums"]["severity_4"] | null
        }
        Relationships: [
          {
            foreignKeyName: "log_body_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_cycle: {
        Row: {
          clotting: Database["public"]["Enums"]["clotting_size"] | null
          cramping: Database["public"]["Enums"]["severity_4"] | null
          cycle_phase: Database["public"]["Enums"]["cycle_phase"] | null
          flow_intensity: Database["public"]["Enums"]["flow_intensity"] | null
          log_id: string
          period_status: Database["public"]["Enums"]["period_status"] | null
        }
        Insert: {
          clotting?: Database["public"]["Enums"]["clotting_size"] | null
          cramping?: Database["public"]["Enums"]["severity_4"] | null
          cycle_phase?: Database["public"]["Enums"]["cycle_phase"] | null
          flow_intensity?: Database["public"]["Enums"]["flow_intensity"] | null
          log_id: string
          period_status?: Database["public"]["Enums"]["period_status"] | null
        }
        Update: {
          clotting?: Database["public"]["Enums"]["clotting_size"] | null
          cramping?: Database["public"]["Enums"]["severity_4"] | null
          cycle_phase?: Database["public"]["Enums"]["cycle_phase"] | null
          flow_intensity?: Database["public"]["Enums"]["flow_intensity"] | null
          log_id?: string
          period_status?: Database["public"]["Enums"]["period_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "log_cycle_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_energy: {
        Row: {
          energy_crash_time:
            | Database["public"]["Enums"]["energy_crash_time"]
            | null
          evening_energy: number | null
          functional_capacity:
            | Database["public"]["Enums"]["functional_capacity"]
            | null
          log_id: string
          midday_energy: number | null
          morning_energy: number | null
          rest_helped: Database["public"]["Enums"]["rest_helped"] | null
        }
        Insert: {
          energy_crash_time?:
            | Database["public"]["Enums"]["energy_crash_time"]
            | null
          evening_energy?: number | null
          functional_capacity?:
            | Database["public"]["Enums"]["functional_capacity"]
            | null
          log_id: string
          midday_energy?: number | null
          morning_energy?: number | null
          rest_helped?: Database["public"]["Enums"]["rest_helped"] | null
        }
        Update: {
          energy_crash_time?:
            | Database["public"]["Enums"]["energy_crash_time"]
            | null
          evening_energy?: number | null
          functional_capacity?:
            | Database["public"]["Enums"]["functional_capacity"]
            | null
          log_id?: string
          midday_energy?: number | null
          morning_energy?: number | null
          rest_helped?: Database["public"]["Enums"]["rest_helped"] | null
        }
        Relationships: [
          {
            foreignKeyName: "log_energy_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_mood: {
        Row: {
          anxiety: Database["public"]["Enums"]["severity_4"] | null
          brain_fog: Database["public"]["Enums"]["severity_4"] | null
          emotional_eating: boolean | null
          feeling_like_yourself:
            | Database["public"]["Enums"]["feeling_like_self"]
            | null
          irritability: Database["public"]["Enums"]["severity_4"] | null
          log_id: string
          memory_gaps: boolean | null
          mood_score: number | null
          motivation: Database["public"]["Enums"]["motivation_level"] | null
          screen_behaviour:
            | Database["public"]["Enums"]["screen_behaviour"]
            | null
          social_energy: Database["public"]["Enums"]["social_energy"] | null
          social_match: Database["public"]["Enums"]["social_match"] | null
        }
        Insert: {
          anxiety?: Database["public"]["Enums"]["severity_4"] | null
          brain_fog?: Database["public"]["Enums"]["severity_4"] | null
          emotional_eating?: boolean | null
          feeling_like_yourself?:
            | Database["public"]["Enums"]["feeling_like_self"]
            | null
          irritability?: Database["public"]["Enums"]["severity_4"] | null
          log_id: string
          memory_gaps?: boolean | null
          mood_score?: number | null
          motivation?: Database["public"]["Enums"]["motivation_level"] | null
          screen_behaviour?:
            | Database["public"]["Enums"]["screen_behaviour"]
            | null
          social_energy?: Database["public"]["Enums"]["social_energy"] | null
          social_match?: Database["public"]["Enums"]["social_match"] | null
        }
        Update: {
          anxiety?: Database["public"]["Enums"]["severity_4"] | null
          brain_fog?: Database["public"]["Enums"]["severity_4"] | null
          emotional_eating?: boolean | null
          feeling_like_yourself?:
            | Database["public"]["Enums"]["feeling_like_self"]
            | null
          irritability?: Database["public"]["Enums"]["severity_4"] | null
          log_id?: string
          memory_gaps?: boolean | null
          mood_score?: number | null
          motivation?: Database["public"]["Enums"]["motivation_level"] | null
          screen_behaviour?:
            | Database["public"]["Enums"]["screen_behaviour"]
            | null
          social_energy?: Database["public"]["Enums"]["social_energy"] | null
          social_match?: Database["public"]["Enums"]["social_match"] | null
        }
        Relationships: [
          {
            foreignKeyName: "log_mood_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_notes: {
        Row: {
          content: string | null
          log_id: string
        }
        Insert: {
          content?: string | null
          log_id: string
        }
        Update: {
          content?: string | null
          log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_notes_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_skin_hair: {
        Row: {
          breakout_locations: string[] | null
          hair_shedding: Database["public"]["Enums"]["shedding_level"] | null
          log_id: string
          new_skincare_product: string | null
          scalp: Database["public"]["Enums"]["scalp_state"] | null
          skin_feel: Database["public"]["Enums"]["skin_feel"] | null
          skin_state: Database["public"]["Enums"]["skin_state"] | null
        }
        Insert: {
          breakout_locations?: string[] | null
          hair_shedding?: Database["public"]["Enums"]["shedding_level"] | null
          log_id: string
          new_skincare_product?: string | null
          scalp?: Database["public"]["Enums"]["scalp_state"] | null
          skin_feel?: Database["public"]["Enums"]["skin_feel"] | null
          skin_state?: Database["public"]["Enums"]["skin_state"] | null
        }
        Update: {
          breakout_locations?: string[] | null
          hair_shedding?: Database["public"]["Enums"]["shedding_level"] | null
          log_id?: string
          new_skincare_product?: string | null
          scalp?: Database["public"]["Enums"]["scalp_state"] | null
          skin_feel?: Database["public"]["Enums"]["skin_feel"] | null
          skin_state?: Database["public"]["Enums"]["skin_state"] | null
        }
        Relationships: [
          {
            foreignKeyName: "log_skin_hair_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_sleep: {
        Row: {
          felt_rested: Database["public"]["Enums"]["rested_on_waking"] | null
          hours_slept: number | null
          log_id: string
          night_sweats: Database["public"]["Enums"]["severity_4"] | null
          sleep_quality: number | null
          woke_during_night: Database["public"]["Enums"]["night_waking"] | null
        }
        Insert: {
          felt_rested?: Database["public"]["Enums"]["rested_on_waking"] | null
          hours_slept?: number | null
          log_id: string
          night_sweats?: Database["public"]["Enums"]["severity_4"] | null
          sleep_quality?: number | null
          woke_during_night?: Database["public"]["Enums"]["night_waking"] | null
        }
        Update: {
          felt_rested?: Database["public"]["Enums"]["rested_on_waking"] | null
          hours_slept?: number | null
          log_id?: string
          night_sweats?: Database["public"]["Enums"]["severity_4"] | null
          sleep_quality?: number | null
          woke_during_night?: Database["public"]["Enums"]["night_waking"] | null
        }
        Relationships: [
          {
            foreignKeyName: "log_sleep_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_substances: {
        Row: {
          alcohol: Database["public"]["Enums"]["alcohol_units"] | null
          alcohol_type: Database["public"]["Enums"]["alcohol_type"] | null
          caffeine: Database["public"]["Enums"]["caffeine_level"] | null
          log_id: string
          next_morning_feel:
            | Database["public"]["Enums"]["next_morning_feel"]
            | null
        }
        Insert: {
          alcohol?: Database["public"]["Enums"]["alcohol_units"] | null
          alcohol_type?: Database["public"]["Enums"]["alcohol_type"] | null
          caffeine?: Database["public"]["Enums"]["caffeine_level"] | null
          log_id: string
          next_morning_feel?:
            | Database["public"]["Enums"]["next_morning_feel"]
            | null
        }
        Update: {
          alcohol?: Database["public"]["Enums"]["alcohol_units"] | null
          alcohol_type?: Database["public"]["Enums"]["alcohol_type"] | null
          caffeine?: Database["public"]["Enums"]["caffeine_level"] | null
          log_id?: string
          next_morning_feel?:
            | Database["public"]["Enums"]["next_morning_feel"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "log_substances_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      log_whats_new: {
        Row: {
          day_change: string | null
          followup_feel: string | null
          log_id: string
          new_food: string | null
          new_product: string | null
          new_product_type: string | null
        }
        Insert: {
          day_change?: string | null
          followup_feel?: string | null
          log_id: string
          new_food?: string | null
          new_product?: string | null
          new_product_type?: string | null
        }
        Update: {
          day_change?: string | null
          followup_feel?: string | null
          log_id?: string
          new_food?: string | null
          new_product?: string | null
          new_product_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_whats_new_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: true
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          date: string
          deleted_at: string | null
          details: Json
          id: string
          record_type: Database["public"]["Enums"]["record_type"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          date: string
          deleted_at?: string | null
          details?: Json
          id?: string
          record_type: Database["public"]["Enums"]["record_type"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          details?: Json
          id?: string
          record_type?: Database["public"]["Enums"]["record_type"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      thoughts_entries: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          entry_text: string
          id: string
          include_in_doctor_report: boolean | null
          prompt_text: string
          prompt_week_number: number
          updated_at: string | null
          user_id: string
          written_at: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          entry_text: string
          id?: string
          include_in_doctor_report?: boolean | null
          prompt_text: string
          prompt_week_number: number
          updated_at?: string | null
          user_id: string
          written_at: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          entry_text?: string
          id?: string
          include_in_doctor_report?: boolean | null
          prompt_text?: string
          prompt_week_number?: number
          updated_at?: string | null
          user_id?: string
          written_at?: string
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          appointment_reminder_lead_time:
            | Database["public"]["Enums"]["appointment_lead_time"]
            | null
          appointment_reminders_enabled: boolean | null
          avatar_url: string | null
          created_at: string | null
          cycle_regularity:
            | Database["public"]["Enums"]["cycle_regularity"]
            | null
          date_of_birth_month: number | null
          date_of_birth_year: number | null
          deleted_at: string | null
          diagnosed_conditions: string[] | null
          diagnosed_conditions_other: string | null
          evening_reminder_enabled: boolean | null
          evening_reminder_time: string | null
          exercise_types: string[] | null
          exercise_types_other: string | null
          exercises_regularly: boolean | null
          first_name: string | null
          has_fibroids: Database["public"]["Enums"]["fibroid_status"] | null
          hormonal_treatment: boolean | null
          hormonal_treatment_type: string | null
          id: string
          joint_conditions: boolean | null
          joint_conditions_detail: string | null
          last_initial: string | null
          morning_reminder_enabled: boolean | null
          morning_reminder_time: string | null
          onboarding_completed: boolean | null
          perimenopause_status:
            | Database["public"]["Enums"]["perimenopause_status"]
            | null
          stress_baseline: Database["public"]["Enums"]["stress_level"] | null
          theme: Database["public"]["Enums"]["theme_preference"] | null
          tracking_goals: string[] | null
          tracks_food: boolean | null
          updated_at: string | null
          weekly_insight_enabled: boolean | null
        }
        Insert: {
          appointment_reminder_lead_time?:
            | Database["public"]["Enums"]["appointment_lead_time"]
            | null
          appointment_reminders_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          cycle_regularity?:
            | Database["public"]["Enums"]["cycle_regularity"]
            | null
          date_of_birth_month?: number | null
          date_of_birth_year?: number | null
          deleted_at?: string | null
          diagnosed_conditions?: string[] | null
          diagnosed_conditions_other?: string | null
          evening_reminder_enabled?: boolean | null
          evening_reminder_time?: string | null
          exercise_types?: string[] | null
          exercise_types_other?: string | null
          exercises_regularly?: boolean | null
          first_name?: string | null
          has_fibroids?: Database["public"]["Enums"]["fibroid_status"] | null
          hormonal_treatment?: boolean | null
          hormonal_treatment_type?: string | null
          id: string
          joint_conditions?: boolean | null
          joint_conditions_detail?: string | null
          last_initial?: string | null
          morning_reminder_enabled?: boolean | null
          morning_reminder_time?: string | null
          onboarding_completed?: boolean | null
          perimenopause_status?:
            | Database["public"]["Enums"]["perimenopause_status"]
            | null
          stress_baseline?: Database["public"]["Enums"]["stress_level"] | null
          theme?: Database["public"]["Enums"]["theme_preference"] | null
          tracking_goals?: string[] | null
          tracks_food?: boolean | null
          updated_at?: string | null
          weekly_insight_enabled?: boolean | null
        }
        Update: {
          appointment_reminder_lead_time?:
            | Database["public"]["Enums"]["appointment_lead_time"]
            | null
          appointment_reminders_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          cycle_regularity?:
            | Database["public"]["Enums"]["cycle_regularity"]
            | null
          date_of_birth_month?: number | null
          date_of_birth_year?: number | null
          deleted_at?: string | null
          diagnosed_conditions?: string[] | null
          diagnosed_conditions_other?: string | null
          evening_reminder_enabled?: boolean | null
          evening_reminder_time?: string | null
          exercise_types?: string[] | null
          exercise_types_other?: string | null
          exercises_regularly?: boolean | null
          first_name?: string | null
          has_fibroids?: Database["public"]["Enums"]["fibroid_status"] | null
          hormonal_treatment?: boolean | null
          hormonal_treatment_type?: string | null
          id?: string
          joint_conditions?: boolean | null
          joint_conditions_detail?: string | null
          last_initial?: string | null
          morning_reminder_enabled?: boolean | null
          morning_reminder_time?: string | null
          onboarding_completed?: boolean | null
          perimenopause_status?:
            | Database["public"]["Enums"]["perimenopause_status"]
            | null
          stress_baseline?: Database["public"]["Enums"]["stress_level"] | null
          theme?: Database["public"]["Enums"]["theme_preference"] | null
          tracking_goals?: string[] | null
          tracks_food?: boolean | null
          updated_at?: string | null
          weekly_insight_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      purge_soft_deleted_data: { Args: never; Returns: undefined }
    }
    Enums: {
      alcohol_type: "wine" | "beer" | "spirits" | "mixed" | "other"
      alcohol_units: "none" | "1_2" | "3_4" | "4_plus"
      appointment_lead_time: "1_day" | "3_days" | "1_week" | "2_weeks"
      body_after: "energised" | "fine" | "tired" | "wrecked"
      body_during: "great" | "got_through" | "modified" | "stopped"
      caffeine_level: "normal" | "more" | "less" | "none"
      clotting_size: "none" | "small" | "large"
      condition_status: "active" | "managed" | "in_remission"
      confidence_level: "just_noticing" | "worth_watching" | "strong_pattern"
      cycle_phase:
        | "menstrual"
        | "follicular"
        | "ovulatory"
        | "luteal"
        | "unknown"
      cycle_regularity: "regular" | "irregular" | "no_cycle"
      digestion_state:
        | "normal"
        | "sluggish"
        | "unsettled"
        | "nausea"
        | "both_ends"
      energy_crash_time: "none" | "morning" | "midday" | "afternoon" | "evening"
      exercise_status: "yes" | "no" | "planned_didnt"
      feeling_like_self: "yes" | "mostly" | "not_really" | "not_at_all"
      fibroid_status: "no" | "yes" | "suspected" | "removed"
      flow_intensity: "none" | "light" | "medium" | "heavy" | "very_heavy"
      frequency: "once_daily" | "twice_daily" | "as_needed" | "other"
      functional_capacity: "full" | "reduced" | "rest"
      illness_severity: "mild" | "moderate" | "significant"
      insight_type:
        | "weekly_summary"
        | "monthly_correlation"
        | "watch_list_item"
        | "doctor_report"
      intensity_level: "easy" | "moderate" | "hard" | "destroyed"
      medication_type: "prescribed" | "otc"
      mind_body_alignment:
        | "both_ready"
        | "mind_ready"
        | "body_ready"
        | "neither"
      motivation_level: "ready" | "pushed" | "struggled" | "couldnt_start"
      next_morning_feel: "fine" | "slightly_off" | "rough" | "never_again"
      night_waking: "slept_through" | "once" | "few_times" | "all_night"
      perimenopause_status: "yes" | "suspected" | "no" | "unsure"
      period_status: "none" | "started" | "ongoing" | "ended" | "spotting"
      record_type:
        | "lab_result"
        | "scan"
        | "medication"
        | "supplement"
        | "appointment"
        | "condition"
        | "illness"
      rest_day_type: "intentional" | "body_said_no" | "just_didnt"
      rest_helped: "yes" | "partial" | "no" | "didnt_rest"
      rested_on_waking: "yes" | "kind_of" | "not_at_all"
      scalp_state: "fine" | "itchy" | "dry" | "tender"
      screen_behaviour: "normal" | "more_than_usual" | "doom_scrolling" | "numb"
      severity_4: "none" | "mild" | "moderate" | "severe"
      severity_5: "1" | "2" | "3" | "4" | "5"
      shedding_level: "normal" | "more_than_usual" | "a_lot_more"
      skin_feel: "normal" | "dry" | "oily" | "sensitive" | "combination"
      skin_state:
        | "clear"
        | "one_two_spots"
        | "breaking_out"
        | "cystic"
        | "irritated"
      social_energy: "wanted_people" | "either_way" | "needed_quiet" | "avoided"
      social_match: "matched" | "more_than_wanted" | "less_than_wanted"
      stress_level: "low" | "moderate" | "high"
      theme_preference: "light" | "dark" | "system"
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
      alcohol_type: ["wine", "beer", "spirits", "mixed", "other"],
      alcohol_units: ["none", "1_2", "3_4", "4_plus"],
      appointment_lead_time: ["1_day", "3_days", "1_week", "2_weeks"],
      body_after: ["energised", "fine", "tired", "wrecked"],
      body_during: ["great", "got_through", "modified", "stopped"],
      caffeine_level: ["normal", "more", "less", "none"],
      clotting_size: ["none", "small", "large"],
      condition_status: ["active", "managed", "in_remission"],
      confidence_level: ["just_noticing", "worth_watching", "strong_pattern"],
      cycle_phase: [
        "menstrual",
        "follicular",
        "ovulatory",
        "luteal",
        "unknown",
      ],
      cycle_regularity: ["regular", "irregular", "no_cycle"],
      digestion_state: [
        "normal",
        "sluggish",
        "unsettled",
        "nausea",
        "both_ends",
      ],
      energy_crash_time: ["none", "morning", "midday", "afternoon", "evening"],
      exercise_status: ["yes", "no", "planned_didnt"],
      feeling_like_self: ["yes", "mostly", "not_really", "not_at_all"],
      fibroid_status: ["no", "yes", "suspected", "removed"],
      flow_intensity: ["none", "light", "medium", "heavy", "very_heavy"],
      frequency: ["once_daily", "twice_daily", "as_needed", "other"],
      functional_capacity: ["full", "reduced", "rest"],
      illness_severity: ["mild", "moderate", "significant"],
      insight_type: [
        "weekly_summary",
        "monthly_correlation",
        "watch_list_item",
        "doctor_report",
      ],
      intensity_level: ["easy", "moderate", "hard", "destroyed"],
      medication_type: ["prescribed", "otc"],
      mind_body_alignment: [
        "both_ready",
        "mind_ready",
        "body_ready",
        "neither",
      ],
      motivation_level: ["ready", "pushed", "struggled", "couldnt_start"],
      next_morning_feel: ["fine", "slightly_off", "rough", "never_again"],
      night_waking: ["slept_through", "once", "few_times", "all_night"],
      perimenopause_status: ["yes", "suspected", "no", "unsure"],
      period_status: ["none", "started", "ongoing", "ended", "spotting"],
      record_type: [
        "lab_result",
        "scan",
        "medication",
        "supplement",
        "appointment",
        "condition",
        "illness",
      ],
      rest_day_type: ["intentional", "body_said_no", "just_didnt"],
      rest_helped: ["yes", "partial", "no", "didnt_rest"],
      rested_on_waking: ["yes", "kind_of", "not_at_all"],
      scalp_state: ["fine", "itchy", "dry", "tender"],
      screen_behaviour: ["normal", "more_than_usual", "doom_scrolling", "numb"],
      severity_4: ["none", "mild", "moderate", "severe"],
      severity_5: ["1", "2", "3", "4", "5"],
      shedding_level: ["normal", "more_than_usual", "a_lot_more"],
      skin_feel: ["normal", "dry", "oily", "sensitive", "combination"],
      skin_state: [
        "clear",
        "one_two_spots",
        "breaking_out",
        "cystic",
        "irritated",
      ],
      social_energy: ["wanted_people", "either_way", "needed_quiet", "avoided"],
      social_match: ["matched", "more_than_wanted", "less_than_wanted"],
      stress_level: ["low", "moderate", "high"],
      theme_preference: ["light", "dark", "system"],
    },
  },
} as const
