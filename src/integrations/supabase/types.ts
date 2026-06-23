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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      agents: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          display_order: number
          email: string | null
          full_name: string
          id: string
          phone: string | null
          photo: string | null
          position: string | null
          slug: string
          socials: Json | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          photo?: string | null
          position?: string | null
          slug: string
          socials?: Json | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          photo?: string | null
          position?: string | null
          slug?: string
          socials?: Json | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      amenities: {
        Row: {
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image: string | null
          gallery_images: Json
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_minutes: number | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          gallery_images?: Json
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          gallery_images?: Json
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          approved: boolean
          author_email: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          post_id: string | null
          review_id: string | null
        }
        Insert: {
          approved?: boolean
          author_email?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          post_id?: string | null
          review_id?: string | null
        }
        Update: {
          approved?: boolean
          author_email?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string | null
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          status: Database["public"]["Enums"]["lead_status"]
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          subject?: string | null
        }
        Relationships: []
      }
      featured_properties: {
        Row: {
          created_at: string
          display_order: number
          id: string
          property_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          property_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          agent_id: string | null
          assigned_to: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          preferred_contact: string | null
          property_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          assigned_to?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          assigned_to?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["lead_status"] | null
          id: string
          inquiry_id: string
          note: string | null
          to_status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: string
          inquiry_id: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: string
          inquiry_id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          hero_image: string | null
          id: string
          name: string
          region: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          name: string
          region?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          name?: string
          region?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          subscribed: boolean
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          subscribed?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          subscribed?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          agent_id: string | null
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          excerpt: string | null
          featured: boolean
          id: string
          latitude: number | null
          listing_type: Database["public"]["Enums"]["property_listing_type"]
          location_id: string | null
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          parking: number | null
          price: number
          price_period: string | null
          property_type_id: string | null
          publish_status: Database["public"]["Enums"]["property_publish_status"]
          published_at: string | null
          slug: string
          status_id: string | null
          title: string
          updated_at: string
          views_count: number
          year_built: number | null
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["property_listing_type"]
          location_id?: string | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          parking?: number | null
          price?: number
          price_period?: string | null
          property_type_id?: string | null
          publish_status?: Database["public"]["Enums"]["property_publish_status"]
          published_at?: string | null
          slug: string
          status_id?: string | null
          title: string
          updated_at?: string
          views_count?: number
          year_built?: number | null
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["property_listing_type"]
          location_id?: string | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          parking?: number | null
          price?: number
          price_period?: string | null
          property_type_id?: string | null
          publish_status?: Database["public"]["Enums"]["property_publish_status"]
          published_at?: string | null
          slug?: string
          status_id?: string | null
          title?: string
          updated_at?: string
          views_count?: number
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "property_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "property_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "property_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      property_amenities: {
        Row: {
          amenity_id: string
          property_id: string
        }
        Insert: {
          amenity_id: string
          property_id: string
        }
        Update: {
          amenity_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_categories: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          created_at: string
          file_url: string
          id: string
          name: string
          property_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          name: string
          property_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_order: number
          image_url: string
          is_featured: boolean
          property_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_order?: number
          image_url: string
          is_featured?: boolean
          property_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_order?: number
          image_url?: string
          is_featured?: boolean
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reviews: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image: string | null
          gallery_images: Json
          id: string
          location_id: string | null
          meta_description: string | null
          meta_title: string | null
          property_id: string | null
          published_at: string | null
          rating: number | null
          slug: string
          status: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          gallery_images?: Json
          id?: string
          location_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          property_id?: string | null
          published_at?: string | null
          rating?: number | null
          slug: string
          status?: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          gallery_images?: Json
          id?: string
          location_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          property_id?: string | null
          published_at?: string | null
          rating?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["review_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_statuses: {
        Row: {
          color: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      property_types: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      property_videos: {
        Row: {
          created_at: string
          id: string
          property_id: string
          title: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          title?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          title?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_videos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_properties: {
        Row: {
          created_at: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          business_hours: string | null
          company_name: string
          company_whatsapp: string | null
          hero_headline: string | null
          hero_subheadline: string | null
          id: number
          logo_url: string | null
          office_address: string | null
          primary_email: string | null
          primary_phone: string | null
          seo_default_description: string | null
          seo_default_title: string | null
          social_links: Json | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          business_hours?: string | null
          company_name?: string
          company_whatsapp?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: number
          logo_url?: string | null
          office_address?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          business_hours?: string | null
          company_name?: string
          company_whatsapp?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: number
          logo_url?: string | null
          office_address?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_photo: string | null
          author_title: string | null
          created_at: string
          display_order: number
          featured: boolean
          id: string
          published: boolean
          quote: string
          rating: number | null
        }
        Insert: {
          author_name: string
          author_photo?: string | null
          author_title?: string | null
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          published?: boolean
          quote: string
          rating?: number | null
        }
        Update: {
          author_name?: string
          author_photo?: string | null
          author_title?: string | null
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          published?: boolean
          quote?: string
          rating?: number | null
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
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "editor" | "agent" | "user"
      blog_post_status: "draft" | "published" | "scheduled"
      lead_source:
        | "website_form"
        | "property_inquiry"
        | "contact_page"
        | "whatsapp"
        | "newsletter"
        | "referral"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "viewing_scheduled"
        | "offer_made"
        | "won"
        | "lost"
        | "closed"
      property_listing_type: "sale" | "rent"
      property_publish_status: "draft" | "published" | "archived"
      review_status: "draft" | "published"
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
      app_role: ["super_admin", "admin", "editor", "agent", "user"],
      blog_post_status: ["draft", "published", "scheduled"],
      lead_source: [
        "website_form",
        "property_inquiry",
        "contact_page",
        "whatsapp",
        "newsletter",
        "referral",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "viewing_scheduled",
        "offer_made",
        "won",
        "lost",
        "closed",
      ],
      property_listing_type: ["sale", "rent"],
      property_publish_status: ["draft", "published", "archived"],
      review_status: ["draft", "published"],
    },
  },
} as const
