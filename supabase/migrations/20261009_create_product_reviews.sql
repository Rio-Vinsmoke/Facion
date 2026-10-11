-- FACION — Product Reviews Schema Migration
-- Creates the product_reviews table, constraints, indexes, and Row-Level Security policies.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  review_text text not null check (char_length(trim(review_text)) > 0),
  reviewer_name text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comments
comment on table public.product_reviews is 'Customer ratings and reviews for FACION products.';
comment on column public.product_reviews.is_demo is 'True if this is a sample review for college demonstration purposes.';

-- Indexes for efficient querying by product, user, and date
create index if not exists idx_product_reviews_product_id
  on public.product_reviews(product_id);

create index if not exists idx_product_reviews_user_id
  on public.product_reviews(user_id);

create index if not exists idx_product_reviews_created_at
  on public.product_reviews(created_at desc);

-- Unique constraint: Each registered customer can only submit one review per product
create unique index if not exists idx_unique_customer_product_review
  on public.product_reviews(product_id, user_id)
  where (is_demo = false and user_id is not null);

-- Enable Row-Level Security
alter table public.product_reviews enable row level security;

-- RLS Policy 1: Public read access for all reviews (both authentic and demo reviews)
create policy "Anyone can read product reviews"
  on public.product_reviews
  for select
  using (true);

-- RLS Policy 2: Authenticated users can submit reviews for products
create policy "Authenticated customers can submit reviews"
  on public.product_reviews
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and is_demo = false
  );

-- RLS Policy 3: Review authors can update their own reviews
create policy "Review authors can update their own reviews"
  on public.product_reviews
  for update
  to authenticated
  using (auth.uid() = user_id and is_demo = false)
  with check (auth.uid() = user_id and is_demo = false);

-- RLS Policy 4: Review authors can delete their own reviews
create policy "Review authors can delete their own reviews"
  on public.product_reviews
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Permissions
grant select on public.product_reviews to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;
