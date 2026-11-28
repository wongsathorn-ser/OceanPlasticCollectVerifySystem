-- Local PostgreSQL update for the pre-D13 schema shown on 28 Nov 2026.
-- Keep existing users, boats, records, photos and demo landing sites.
-- Legacy one-photo rows are SCALE photos; no PLASTIC evidence is fabricated.
-- Run with psql -v ON_ERROR_STOP=1. All changes commit together.

BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS landing_site_id integer REFERENCES public.landing_sites(id),
  ADD COLUMN IF NOT EXISTS auto_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_rule varchar(300),
  ADD COLUMN IF NOT EXISTS spot_check boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spot_checked_by integer REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS spot_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS reversed_by integer REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS reversed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reversal_reason varchar(500);

ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS auto_verify_blocked_until timestamptz;

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS kind varchar(10) NOT NULL DEFAULT 'SCALE',
  ADD COLUMN IF NOT EXISTS sha256 varchar(64);

UPDATE public.photos
SET sha256 = encode(sha256(data), 'hex')
WHERE sha256 IS NULL;

-- Enforce one photo of EACH kind, replacing the old one-photo-per-record index.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.photos'::regclass
      AND conname = 'photos_record_id_kind_key'
  ) THEN
    ALTER TABLE public.photos
      ADD CONSTRAINT photos_record_id_kind_key UNIQUE (record_id, kind);
  END IF;
END;
$$;

DROP INDEX IF EXISTS public.ix_photos_record_id;
CREATE INDEX ix_photos_record_id ON public.photos (record_id);
CREATE INDEX IF NOT EXISTS ix_photos_sha256 ON public.photos (sha256);
CREATE INDEX IF NOT EXISTS ix_records_landing_site_id ON public.records (landing_site_id);
CREATE INDEX IF NOT EXISTS ix_records_auto_verified ON public.records (auto_verified);
CREATE INDEX IF NOT EXISTS ix_records_spot_check ON public.records (spot_check);

COMMIT;
