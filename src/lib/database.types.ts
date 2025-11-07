export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          file_type: string;
          file_size: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          file_type?: string;
          file_size?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          file_type?: string;
          file_size?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      annotations: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          content: string;
          highlighted_text: string;
          position_start: number;
          position_end: number;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          content?: string;
          highlighted_text: string;
          position_start: number;
          position_end: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          content?: string;
          highlighted_text?: string;
          position_start?: number;
          position_end?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          source_document_id: string;
          target_document_id: string;
          source_annotation_id: string | null;
          target_annotation_id: string | null;
          connection_type: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_document_id: string;
          target_document_id: string;
          source_annotation_id?: string | null;
          target_annotation_id?: string | null;
          connection_type?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_document_id?: string;
          target_document_id?: string;
          source_annotation_id?: string | null;
          target_annotation_id?: string | null;
          connection_type?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_documents: {
        Row: {
          id: string;
          collection_id: string;
          document_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          document_id: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          document_id?: string;
          added_at?: string;
        };
      };
    };
  };
};
