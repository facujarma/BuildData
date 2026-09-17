-- Embeddings de entidades (nombres → IDs sin LLM) con pgvector + OpenAI.
-- Ejecutar una vez en el SQL editor de Supabase.
--
-- Supabase suele tener la extensión en el esquema "extensions". El tipo "vector"
-- se resuelve porque ese esquema está en el search_path; si no, usar
-- extensions.vector(1536). Si la extensión ya existe, el create solo avisa.

create extension if not exists vector with schema extensions;

alter table materiales  add column if not exists embedding vector(1536);
alter table proveedores add column if not exists embedding vector(1536);
alter table rubros      add column if not exists embedding vector(1536);
alter table tareas      add column if not exists embedding vector(1536);

alter table materiales  add column if not exists embedding_model text;
alter table proveedores add column if not exists embedding_model text;
alter table rubros      add column if not exists embedding_model text;
alter table tareas      add column if not exists embedding_model text;

alter table materiales  add column if not exists embedding_updated_at timestamptz;
alter table proveedores add column if not exists embedding_updated_at timestamptz;
alter table rubros      add column if not exists embedding_updated_at timestamptz;
alter table tareas      add column if not exists embedding_updated_at timestamptz;

-- Sin índice a propósito: los catálogos por obra son chicos y un índice ANN
-- (HNSW/IVFFlat) combinado con el filtro por obra_id puede perder recall.
-- Se agrega solo si el volumen lo justifica y midiendo.
