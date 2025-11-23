-- Add slug & updatedAt columns to match the current Prisma schema
ALTER TABLE "Category"
ADD COLUMN "slug" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Generate deterministic slugs for existing rows
WITH ranked AS (
  SELECT
    id,
    slug_base,
    ROW_NUMBER() OVER (PARTITION BY slug_base ORDER BY id) AS rn
  FROM (
    SELECT
      id,
      COALESCE(
        NULLIF(
          REGEXP_REPLACE(LOWER(TRIM(name)), '[^a-z0-9]+', '-', 'g'),
          ''
        ),
        'category'
      ) AS slug_base
    FROM "Category"
  ) base
)
UPDATE "Category" AS c
SET "slug" = CASE
  WHEN ranked.rn = 1 THEN ranked.slug_base
  ELSE ranked.slug_base || '-' || ranked.rn
END
FROM ranked
WHERE c.id = ranked.id;

ALTER TABLE "Category"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_slug_idx" ON "Category"("slug");
