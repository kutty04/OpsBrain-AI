-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS knowledge_edges CASCADE;
DROP TABLE IF EXISTS knowledge_nodes CASCADE;
DROP TABLE IF EXISTS compliance_records CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS asset_risk_scores CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- 1. Assets (Digital Twins)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Persistent Asset Risk Scores
CREATE TABLE asset_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(50) NOT NULL,
    explanation TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Documents Registry
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_path TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Semantic Chunks (using BAAI bge-small-en-v1.5 dimension: 384)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384),
    page_number INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Incidents
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    root_cause TEXT,
    severity VARCHAR(50) DEFAULT 'Low',
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Maintenance Logs
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    work_order_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    performed_by VARCHAR(255),
    maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cost NUMERIC(12, 2)
);

-- 7. Compliance Records
CREATE TABLE compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    regulation_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    findings TEXT
);

-- 8. Knowledge Graph Nodes
CREATE TABLE knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    metadata JSONB
);

-- 9. Knowledge Graph Edges (Relational representation)
CREATE TABLE knowledge_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    weight NUMERIC(3,2) DEFAULT 1.0,
    metadata JSONB,
    UNIQUE(source_id, target_id, relation_type)
);

-- Create index for vector search
-- CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Vector Search RPC matching BAAI 384 dimensions
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity float,
  page_number INT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity,
    document_chunks.page_number
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
