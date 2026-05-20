WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY resource_id
      ORDER BY created_at ASC, id ASC
    ) - 1 AS sort_order
  FROM endpoints
)
UPDATE endpoints
SET sort_order = ranked.sort_order
FROM ranked
WHERE endpoints.id = ranked.id;
