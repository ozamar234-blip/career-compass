export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          age: number | null
          gender: 'male' | 'female' | 'other' | null
          city: string | null
          current_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          age?: number | null
          gender?: 'male' | 'female' | 'other' | null
          city?: string | null
          current_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          age?: number | null
          gender?: 'male' | 'female' | 'other' | null
          city?: string | null
          current_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professions: {
        Row: {
          id: number
          name: string
          category: string | null
          avg_salary_range: string | null
          education_required: string | null
          riasec_codes: string[] | null
          description: string | null
          demand_level: 'low' | 'medium' | 'high' | null
          work_environment: string | null
        }
        Insert: {
          name: string
          category?: string | null
          avg_salary_range?: string | null
          education_required?: string | null
          riasec_codes?: string[] | null
          description?: string | null
          demand_level?: 'low' | 'medium' | 'high' | null
          work_environment?: string | null
        }
        Update: {
          name?: string
          category?: string | null
          avg_salary_range?: string | null
          education_required?: string | null
          riasec_codes?: string[] | null
          description?: string | null
          demand_level?: 'low' | 'medium' | 'high' | null
          work_environment?: string | null
        }
        Relationships: []
      }
      questionnaire_sessions: {
        Row: {
          id: string
          user_id: string
          status: string
          current_question_index: number
          answers: unknown
          ai_analysis: unknown
          matched_professions: number[] | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          current_question_index?: number
          answers?: unknown
          ai_analysis?: unknown
          matched_professions?: number[] | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          current_question_index?: number
          answers?: unknown
          ai_analysis?: unknown
          matched_professions?: number[] | null
          completed_at?: string | null
        }
        Relationships: []
      }
      filtering_rounds: {
        Row: {
          id: string
          session_id: string
          user_id: string
          round_number: number
          input_professions: number[] | null
          selected_professions: number[] | null
          rejected_professions: number[] | null
          maybe_professions: number[] | null
          unknown_professions: number[] | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          round_number: number
          input_professions?: number[] | null
          selected_professions?: number[] | null
          rejected_professions?: number[] | null
          maybe_professions?: number[] | null
          unknown_professions?: number[] | null
          completed_at?: string | null
        }
        Update: {
          session_id?: string
          user_id?: string
          round_number?: number
          input_professions?: number[] | null
          selected_professions?: number[] | null
          rejected_professions?: number[] | null
          maybe_professions?: number[] | null
          unknown_professions?: number[] | null
          completed_at?: string | null
        }
        Relationships: []
      }
      mirror_invitations: {
        Row: {
          id: string
          session_id: string
          user_id: string
          friend_name: string
          friend_phone: string | null
          invite_token: string
          status: string
          sent_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          friend_name: string
          friend_phone?: string | null
          invite_token?: string
          status?: string
          sent_at?: string | null
          completed_at?: string | null
        }
        Update: {
          friend_name?: string
          friend_phone?: string | null
          status?: string
          sent_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      mirror_responses: {
        Row: {
          id: string
          invitation_id: string
          session_id: string
          friend_name: string | null
          answers: unknown
          selected_professions: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          invitation_id: string
          session_id: string
          friend_name?: string | null
          answers: unknown
          selected_professions?: number[] | null
          created_at?: string
        }
        Update: {
          invitation_id?: string
          session_id?: string
          friend_name?: string | null
          answers?: unknown
          selected_professions?: number[] | null
        }
        Relationships: []
      }
      synthesis_reports: {
        Row: {
          id: string
          session_id: string
          user_id: string
          top_3_professions: unknown
          full_analysis: unknown
          action_steps: unknown
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          top_3_professions: unknown
          full_analysis?: unknown
          action_steps?: unknown
          created_at?: string
        }
        Update: {
          top_3_professions?: unknown
          full_analysis?: unknown
          action_steps?: unknown
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          plan: string
          amount: number
          status: string
          payment_provider: string | null
          payment_ref: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          plan: string
          amount?: number
          status?: string
          payment_provider?: string | null
          payment_ref?: string | null
          created_at?: string
        }
        Update: {
          plan?: string
          amount?: number
          status?: string
          payment_provider?: string | null
          payment_ref?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface QuestionAnswer {
  question_id: string
  question_text: string
  answer_text: string
  category: string
  timestamp: string
}

export interface RiasecAnalysis {
  riasec_profile: {
    R: number; I: number; A: number; S: number; E: number; C: number
  }
  vips_profile: {
    values: string[]
    interests: string[]
    personality: string[]
    skills: string[]
  }
  matched_profession_ids: number[]
  match_reasoning: string
}

export interface AIQuestion {
  question_text: string
  question_id: string
  category: string
  answer_type: 'open' | 'choice'
  choices?: string[]
  progress_message: string
}
