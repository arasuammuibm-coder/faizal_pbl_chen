/*
  # Context Weaver Database Schema

  ## Overview
  This migration creates the complete database schema for Context Weaver, a document 
  interaction platform for researchers and students.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `documents`
  Stores uploaded documents and their metadata
  - `id` (uuid, primary key) - Unique document identifier
  - `user_id` (uuid, foreign key) - Owner of the document
  - `title` (text) - Document title
  - `content` (text) - Full document content
  - `file_type` (text) - Type of document (pdf, txt, md, etc.)
  - `file_size` (integer) - Size in bytes
  - `tags` (text[]) - Array of tags for organization
  - `created_at` (timestamptz) - Upload timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ### 3. `annotations`
  User annotations and highlights on documents
  - `id` (uuid, primary key) - Unique annotation identifier
  - `user_id` (uuid, foreign key) - User who created the annotation
  - `document_id` (uuid, foreign key) - Associated document
  - `content` (text) - Annotation text content
  - `highlighted_text` (text) - The text that was highlighted
  - `position_start` (integer) - Start position in document
  - `position_end` (integer) - End position in document
  - `color` (text) - Highlight color
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `connections`
  Cross-document connections and relationships
  - `id` (uuid, primary key) - Unique connection identifier
  - `user_id` (uuid, foreign key) - User who created the connection
  - `source_document_id` (uuid, foreign key) - First document in connection
  - `target_document_id` (uuid, foreign key) - Second document in connection
  - `source_annotation_id` (uuid, foreign key, nullable) - Optional source annotation
  - `target_annotation_id` (uuid, foreign key, nullable) - Optional target annotation
  - `connection_type` (text) - Type of connection (related, contradicts, supports, etc.)
  - `notes` (text) - User notes about the connection
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `collections`
  Document collections for organization
  - `id` (uuid, primary key) - Unique collection identifier
  - `user_id` (uuid, foreign key) - Collection owner
  - `name` (text) - Collection name
  - `description` (text) - Collection description
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. `collection_documents`
  Many-to-many relationship between collections and documents
  - `id` (uuid, primary key) - Unique identifier
  - `collection_id` (uuid, foreign key) - Collection reference
  - `document_id` (uuid, foreign key) - Document reference
  - `added_at` (timestamptz) - When document was added to collection

  ## Security

  All tables have Row Level Security (RLS) enabled. Users can only access their own data.

  ### RLS Policies:
  1. **Profiles**: Users can view and update only their own profile
  2. **Documents**: Users can perform all operations on their own documents
  3. **Annotations**: Users can manage their own annotations
  4. **Connections**: Users can manage their own connections
  5. **Collections**: Users can manage their own collections
  6. **Collection Documents**: Users can manage documents in their own collections

  ## Indexes

  Performance indexes are added for:
  - Document lookups by user
  - Annotation lookups by document and user
  - Connection lookups by documents
  - Collection document lookups
  - Tag searches on documents
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  file_type text DEFAULT 'txt',
  file_size integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create annotations table
CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
  content text DEFAULT '',
  highlighted_text text NOT NULL,
  position_start integer NOT NULL,
  position_end integer NOT NULL,
  color text DEFAULT 'yellow',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own annotations"
  ON annotations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annotations"
  ON annotations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations"
  ON annotations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations"
  ON annotations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  source_document_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
  target_document_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
  source_annotation_id uuid REFERENCES annotations ON DELETE SET NULL,
  target_annotation_id uuid REFERENCES annotations ON DELETE SET NULL,
  connection_type text DEFAULT 'related',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create collection_documents table
CREATE TABLE IF NOT EXISTS collection_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, document_id)
);

ALTER TABLE collection_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in own collections"
  ON collection_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_documents.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add documents to own collections"
  ON collection_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_documents.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove documents from own collections"
  ON collection_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_documents.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_annotations_document_id ON annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_source_doc ON connections(source_document_id);
CREATE INDEX IF NOT EXISTS idx_connections_target_doc ON connections(target_document_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_documents_collection ON collection_documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_documents_document ON collection_documents(document_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();