-- Existing Auth accounts created before the profile trigger need their normal profile.
-- Only active company members; no generated IDs or authorization from user metadata.
BEGIN;
INSERT INTO public.profiles(id,email,full_name)
SELECT u.id,u.email,nullif(btrim(u.raw_user_meta_data->>'full_name'),'')
FROM auth.users u
WHERE EXISTS(SELECT 1 FROM public.company_members m WHERE m.user_id=u.id AND m.ativo)
ON CONFLICT(id) DO NOTHING;
COMMIT;
