-- FACION — Demo Reviews Seed Migration
-- Adds curated sample customer reviews for demonstration purposes.
-- All entries are clearly designated with is_demo = true.

insert into public.product_reviews (
  product_id,
  rating,
  title,
  review_text,
  reviewer_name,
  is_demo,
  created_at
)
select
  p.id as product_id,
  demo.rating,
  demo.title,
  demo.review_text,
  demo.reviewer_name,
  true as is_demo,
  now() - (demo.days_ago || ' days')::interval as created_at
from public.products p
cross join lateral (
  values
    (5, 'Exceptional fit and drape', 'The cut and proportions on this piece are spot-on. Looks even better in person than on the hanger.', 'Aanya Sharma', 4),
    (4, 'Great everyday staple', 'Very versatile styling. Sits comfortably and the color matches the photographs closely.', 'Rohan Mehta', 9),
    (5, 'Loved the silhouette', 'Beautiful design that pairs naturally with both casual and structured layers.', 'Priya Patel', 14),
    (4, 'High quality feel', 'The silhouette is modern and flattering. Really happy with the overall look.', 'Arjun Verma', 22),
    (5, 'Styling favorite in my wardrobe', 'Used this piece in multiple outfits already. Highly recommend!', 'Neha Kapoor', 30)
) as demo(rating, title, review_text, reviewer_name, days_ago)
where p.id in (
  -- Seed for sample products across categories
  'top1',
  'jeans1',
  'FAC-IMG-F8697D1655D683FA9B0E0430',
  'FAC-IMG-7A1941D2F61BECC7F8F41486',
  'FAC-IMG-ED6E78C4788345C151C3C72C',
  'FAC-IMG-0195E5804F76140E64E831C9',
  'FAC-IMG-FABFC067343F7BCD493030B6'
)
on conflict do nothing;
