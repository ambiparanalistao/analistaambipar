-- Disposable CI database only: isolate this scenario from companies retained by the concurrency fixture.
UPDATE public.companies SET ativo=false;
-- One known active company and an existing account with no membership.
INSERT INTO auth.users(id,email) VALUES('29000000-0000-4000-8000-000000000091','access-owner@example.invalid'),('29000000-0000-4000-8000-000000000092','access-unlinked@example.invalid');
INSERT INTO public.profiles(id,email,full_name,role) VALUES('29000000-0000-4000-8000-000000000092','access-unlinked@example.invalid','Unlinked fixture','auditor') ON CONFLICT(id) DO NOTHING;
INSERT INTO public.companies(id,nome,created_by) VALUES('19000000-0000-4000-8000-000000000091','Sole company fixture','29000000-0000-4000-8000-000000000091');
INSERT INTO public.company_members(company_id,user_id,role,maintenance_role,created_by) VALUES('19000000-0000-4000-8000-000000000091','29000000-0000-4000-8000-000000000091','administrador','admin_empresa','29000000-0000-4000-8000-000000000091');
