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
      audio_posts: {
        Row: {
          audio_url: string | null
          comments_count: number | null
          cover_url: string | null
          created_at: string | null
          duration: number | null
          id: string
          is_published: boolean | null
          likes_count: number | null
          plays_count: number | null
          shares_count: number | null
          title: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          comments_count?: number | null
          cover_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          plays_count?: number | null
          shares_count?: number | null
          title: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          comments_count?: number | null
          cover_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          plays_count?: number | null
          shares_count?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          audio_post_id: string | null
          audio_url: string | null
          content: string | null
          created_at: string | null
          id: string
          parent_id: string | null
          podcast_id: string | null
          user_id: string
        }
        Insert: {
          audio_post_id?: string | null
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          podcast_id?: string | null
          user_id: string
        }
        Update: {
          audio_post_id?: string | null
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          podcast_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_audio_post_id_fkey"
            columns: ["audio_post_id"]
            isOneToOne: false
            referencedRelation: "audio_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          audio_post_id: string | null
          created_at: string | null
          id: string
          podcast_id: string | null
          user_id: string
        }
        Insert: {
          audio_post_id?: string | null
          created_at?: string | null
          id?: string
          podcast_id?: string | null
          user_id: string
        }
        Update: {
          audio_post_id?: string | null
          created_at?: string | null
          id?: string
          podcast_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_audio_post_id_fkey"
            columns: ["audio_post_id"]
            isOneToOne: false
            referencedRelation: "audio_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      listening_history: {
        Row: {
          audio_post_id: string | null
          completed: boolean | null
          created_at: string | null
          id: string
          last_played_at: string | null
          podcast_id: string | null
          progress_seconds: number | null
          user_id: string
        }
        Insert: {
          audio_post_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_played_at?: string | null
          podcast_id?: string | null
          progress_seconds?: number | null
          user_id: string
        }
        Update: {
          audio_post_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_played_at?: string | null
          podcast_id?: string | null
          progress_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_audio_post_id_fkey"
            columns: ["audio_post_id"]
            isOneToOne: false
            referencedRelation: "audio_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_history_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          added_at: string | null
          audio_post_id: string | null
          id: string
          playlist_id: string
          podcast_id: string | null
          position: number
        }
        Insert: {
          added_at?: string | null
          audio_post_id?: string | null
          id?: string
          playlist_id: string
          podcast_id?: string | null
          position: number
        }
        Update: {
          added_at?: string | null
          audio_post_id?: string | null
          id?: string
          playlist_id?: string
          podcast_id?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_audio_post_id_fkey"
            columns: ["audio_post_id"]
            isOneToOne: false
            referencedRelation: "audio_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          audio_url: string | null
          chapters: Json | null
          comments_count: number | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_ai_generated: boolean | null
          is_published: boolean | null
          language: string | null
          likes_count: number | null
          plays_count: number | null
          shares_count: number | null
          tags: string[] | null
          title: string
          tone: string | null
          transcript: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          chapters?: Json | null
          comments_count?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          language?: string | null
          likes_count?: number | null
          plays_count?: number | null
          shares_count?: number | null
          tags?: string[] | null
          title: string
          tone?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          chapters?: Json | null
          comments_count?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          language?: string | null
          likes_count?: number | null
          plays_count?: number | null
          shares_count?: number | null
          tags?: string[] | null
          title?: string
          tone?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          audio_bio_url: string | null
          avatar_url: string | null
          bio: string | null
          category: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          interests: string[] | null
          is_creator: boolean | null
          is_verified: boolean | null
          preferred_language: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          audio_bio_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_creator?: boolean | null
          is_verified?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          audio_bio_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_creator?: boolean | null
          is_verified?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_content: {
        Row: {
          audio_post_id: string | null
          created_at: string | null
          id: string
          podcast_id: string | null
          user_id: string
        }
        Insert: {
          audio_post_id?: string | null
          created_at?: string | null
          id?: string
          podcast_id?: string | null
          user_id: string
        }
        Update: {
          audio_post_id?: string | null
          created_at?: string | null
          id?: string
          podcast_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_content_audio_post_id_fkey"
            columns: ["audio_post_id"]
            isOneToOne: false
            referencedRelation: "audio_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_content_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          query: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          query: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
