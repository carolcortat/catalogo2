-- =====================================================================
-- Catálogo Online - esquema inicial
-- Execute este arquivo no Supabase: SQL Editor > New query > Run
-- =====================================================================

-- ---------- Tabelas ----------

create table if not exists public.store_settings (
  id             int primary key default 1 check (id = 1), -- linha única
  store_name     text    not null default 'Minha Loja',
  tagline        text    not null default '',
  logo_url       text,
  brand_color    text    not null default '#e11d74',
  banner_image_url text,
  banner_title   text    not null default 'Bem-vindo(a)!',
  banner_text    text    not null default 'Confira nossos produtos e faça seu pedido pelo WhatsApp.',
  whatsapp_number text   not null default '',
  payment_methods text[] not null default array['pix','credito','debito','dinheiro'],
  accepts_delivery boolean not null default true,
  accepts_pickup   boolean not null default true,
  store_info     text    not null default '',
  updated_at     timestamptz not null default now()
);

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name        text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  price       numeric(10,2) not null check (price >= 0),
  images      text[] not null default '{}',
  available   boolean not null default true,
  -- ex.: [{"name":"Cor","options":["Rosa","Azul"]}]
  variants    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_created_idx  on public.products(created_at desc);

-- Garante que exista a linha única de configurações
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- ---------- Row Level Security ----------
-- Público (anon): somente LEITURA.
-- Vendedor (authenticated): leitura e escrita.
-- Dica: desative "Allow new users to sign up" em Authentication > Providers > Email
-- e crie manualmente o usuário do vendedor, para que só ele possa editar.

alter table public.store_settings enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;

-- Leitura pública
create policy "settings_public_read" on public.store_settings
  for select using (true);
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "products_public_read" on public.products
  for select using (true);

-- Escrita apenas para o vendedor autenticado
create policy "settings_admin_write" on public.store_settings
  for all to authenticated using (true) with check (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated using (true) with check (true);
create policy "products_admin_write" on public.products
  for all to authenticated using (true) with check (true);

-- ---------- Storage (imagens) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-images', 'catalog-images', true,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'catalog-images');
create policy "images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'catalog-images');
create policy "images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'catalog-images');
create policy "images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'catalog-images');
