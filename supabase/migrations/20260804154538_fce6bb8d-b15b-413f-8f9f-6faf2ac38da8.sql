
-- ROLES
create type public.app_role as enum ('STUDENT','AGENT','COUNSELOR','ADMIN');
create type public.app_status as enum ('PRE_REGISTERED','DOCS_PENDING','DOCS_APPROVED','UNIVERSITY_SUBMITTED','CONDITIONAL_OFFER','FINAL_OFFER','REJECTED');
create type public.visa_status as enum ('NOT_STARTED','DOCUMENTS_PREPARING','APPOINTMENT_SCHEDULED','VISA_SUBMITTED','VISA_APPROVED','VISA_REJECTED');
create type public.fee_status as enum ('UNPAID','PARTIALLY_PAID','FULLY_PAID');
create type public.doc_type as enum ('PASSPORT','BAC_DIPLOMA','TRANSCRIPT','FRENCH_TO_TURKISH_TRANSLATION','DENKLIK_CERTIFICATE','CASIER_JUDICIAIRE','VISA_PHOTO','ACCEPTANCE_LETTER','PAYMENT_RECEIPT');
create type public.doc_status as enum ('PENDING_REVIEW','APPROVED','REJECTED');
create type public.degree_level as enum ('ASSOCIATE','BACHELORS','MASTERS','PHD');
create type public.prog_language as enum ('ENGLISH','TURKISH','FRENCH');

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('COUNSELOR','ADMIN'))
$$;

-- bootstrap: first user = ADMIN
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _role public.app_role;
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  if (select count(*) from public.user_roles) = 0 then
    _role := 'ADMIN';
  else
    _role := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'STUDENT')::public.app_role;
    if _role in ('ADMIN','COUNSELOR') then _role := 'STUDENT'; end if;
  end if;
  insert into public.user_roles (user_id, role) values (new.id, _role);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()) or public.has_role(auth.uid(),'AGENT'));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'ADMIN'))
  with check (id = auth.uid() or public.has_role(auth.uid(),'ADMIN'));
create trigger profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

create policy "roles read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "admin manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ADMIN'));

-- UNIVERSITIES
create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  type text not null default 'PRIVATE',
  website_url text,
  logo_url text,
  description_fr text,
  has_agency_discount boolean not null default false,
  discount_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.universities to anon, authenticated;
grant all on public.universities to service_role;
alter table public.universities enable row level security;
create policy "universities public read" on public.universities for select to anon, authenticated using (true);
create policy "universities admin write" on public.universities for all to authenticated
  using (public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ADMIN'));

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name_fr text not null,
  name_en text,
  degree public.degree_level not null default 'BACHELORS',
  language public.prog_language not null default 'ENGLISH',
  tuition_fee_usd numeric not null default 0,
  discounted_agency_fee_usd numeric,
  duration_years numeric not null default 4,
  created_at timestamptz not null default now()
);
grant select on public.programs to anon, authenticated;
grant all on public.programs to service_role;
alter table public.programs enable row level security;
create policy "programs public read" on public.programs for select to anon, authenticated using (true);
create policy "programs admin write" on public.programs for all to authenticated
  using (public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ADMIN'));

create table public.city_living_costs (
  id uuid primary key default gen_random_uuid(),
  city_name text not null unique,
  groceries_usd numeric not null default 0,
  transport_student_usd numeric not null default 0,
  utilities_usd numeric not null default 0,
  studio_rent_usd numeric not null default 0,
  shared_2bed_rent_usd numeric not null default 0,
  shared_3bed_rent_usd numeric not null default 0,
  private_dorm_usd numeric not null default 0
);
grant select on public.city_living_costs to anon, authenticated;
grant all on public.city_living_costs to service_role;
alter table public.city_living_costs enable row level security;
create policy "costs public read" on public.city_living_costs for select to anon, authenticated using (true);
create policy "costs admin write" on public.city_living_costs for all to authenticated
  using (public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ADMIN'));

create table public.document_guides (
  id uuid primary key default gen_random_uuid(),
  document_type public.doc_type not null,
  title_fr text not null,
  description_fr text,
  acquisition_steps_fr text,
  where_to_get_it_fr text,
  sample_image_url text,
  common_rejections_fr text,
  is_required_for_visa boolean not null default true,
  estimated_days integer not null default 7,
  sort_order integer not null default 0
);
grant select on public.document_guides to anon, authenticated;
grant all on public.document_guides to service_role;
alter table public.document_guides enable row level security;
create policy "guides public read" on public.document_guides for select to anon, authenticated using (true);
create policy "guides admin write" on public.document_guides for all to authenticated
  using (public.has_role(auth.uid(),'ADMIN')) with check (public.has_role(auth.uid(),'ADMIN'));

-- STUDENT PROFILES
create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  country_of_origin text not null default 'Mali',
  passport_number text,
  passport_expiry_date date,
  assigned_counselor_id uuid references auth.users(id) on delete set null,
  lead_source text,
  app_status public.app_status not null default 'PRE_REGISTERED',
  visa_status public.visa_status not null default 'NOT_STARTED',
  preferred_major text,
  target_university_id uuid references public.universities(id) on delete set null,
  target_degree public.degree_level,
  agency_fee_status public.fee_status not null default 'UNPAID',
  total_fee_amount numeric not null default 0,
  paid_fee_amount numeric not null default 0,
  currency text not null default 'XOF',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index student_profiles_user_id_key on public.student_profiles(user_id) where user_id is not null;
grant select, insert, update, delete on public.student_profiles to authenticated;
grant all on public.student_profiles to service_role;
alter table public.student_profiles enable row level security;
create trigger student_profiles_updated before update on public.student_profiles for each row execute function public.update_updated_at_column();

create policy "student read own" on public.student_profiles for select to authenticated
  using (user_id = auth.uid() or created_by = auth.uid() or public.is_staff(auth.uid()));
create policy "student insert own" on public.student_profiles for insert to authenticated
  with check (user_id = auth.uid() or created_by = auth.uid() or public.is_staff(auth.uid()));
create policy "staff update" on public.student_profiles for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "admin delete" on public.student_profiles for delete to authenticated
  using (public.has_role(auth.uid(),'ADMIN'));

-- students may edit only their own non-status fields
create or replace function public.guard_student_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff(auth.uid()) then return new; end if;
  if new.app_status is distinct from old.app_status
     or new.visa_status is distinct from old.visa_status
     or new.agency_fee_status is distinct from old.agency_fee_status
     or new.paid_fee_amount is distinct from old.paid_fee_amount
     or new.total_fee_amount is distinct from old.total_fee_amount
     or new.assigned_counselor_id is distinct from old.assigned_counselor_id then
    raise exception 'Not allowed to change status or financial fields';
  end if;
  return new;
end; $$;
create trigger student_profiles_guard before update on public.student_profiles
  for each row execute function public.guard_student_profile_update();

create policy "student update own details" on public.student_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- DOCUMENTS
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  type public.doc_type not null,
  file_url text not null,
  status public.doc_status not null default 'PENDING_REVIEW',
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;
create policy "documents read" on public.documents for select to authenticated
  using (public.is_staff(auth.uid()) or exists (
    select 1 from public.student_profiles s where s.id = student_id and (s.user_id = auth.uid() or s.created_by = auth.uid())));
create policy "documents insert" on public.documents for insert to authenticated
  with check (public.is_staff(auth.uid()) or exists (
    select 1 from public.student_profiles s where s.id = student_id and (s.user_id = auth.uid() or s.created_by = auth.uid())));
create policy "documents staff update" on public.documents for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "documents owner delete" on public.documents for delete to authenticated
  using (public.is_staff(auth.uid()) or exists (
    select 1 from public.student_profiles s where s.id = student_id and s.user_id = auth.uid()));

-- AUDIT LOG
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.student_profiles(id) on delete cascade,
  performed_by_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit staff read" on public.audit_logs for select to authenticated
  using (public.is_staff(auth.uid()));
create policy "audit staff insert" on public.audit_logs for insert to authenticated
  with check (public.is_staff(auth.uid()));

-- PAYMENTS LEDGER
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'XOF',
  method text not null default 'MOBILE_MONEY',
  kind text not null default 'AGENCY_FEE',
  reference text,
  note text,
  recorded_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments staff all" on public.payments for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "payments student read" on public.payments for select to authenticated
  using (exists (select 1 from public.student_profiles s where s.id = student_id and s.user_id = auth.uid()));

-- auto audit on status change
create or replace function public.log_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.app_status is distinct from old.app_status then
    insert into public.audit_logs (student_id, performed_by_user_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'MUTATED_APP_STATUS', old.app_status::text, new.app_status::text);
  end if;
  if new.visa_status is distinct from old.visa_status then
    insert into public.audit_logs (student_id, performed_by_user_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'MUTATED_VISA_STATUS', old.visa_status::text, new.visa_status::text);
  end if;
  return new;
end; $$;
create trigger student_profiles_audit after update on public.student_profiles
  for each row execute function public.log_status_change();

-- SEED reference content
insert into public.universities (name, city, type, website_url, description_fr, has_agency_discount, discount_details) values
('Istanbul Aydin University','Istanbul','PRIVATE','https://www.aydin.edu.tr','Grande université privée à Istanbul, très populaire auprès des étudiants africains.',true,'Jusqu''à 25% de réduction via notre agence'),
('Bahcesehir University','Istanbul','PRIVATE','https://bau.edu.tr','Université internationale avec campus en Europe.',true,'15% de réduction agence'),
('Atilim University','Ankara','PRIVATE','https://www.atilim.edu.tr','Université privée reconnue pour l''ingénierie.',true,'20% de réduction agence'),
('Yasar University','Izmir','PRIVATE','https://www.yasar.edu.tr','Campus moderne au bord de la mer Égée.',false,null),
('Ankara University','Ankara','PUBLIC','https://www.ankara.edu.tr','Université publique historique de la capitale.',false,null),
('Ege University','Izmir','PUBLIC','https://ege.edu.tr','Université publique majeure d''Izmir.',false,null);

insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Génie Informatique','Computer Engineering','BACHELORS','ENGLISH',5500,4100,4 from public.universities where name='Istanbul Aydin University';
insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Médecine','Medicine','BACHELORS','ENGLISH',24000,19500,6 from public.universities where name='Istanbul Aydin University';
insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Commerce International','International Trade','BACHELORS','ENGLISH',7200,6120,4 from public.universities where name='Bahcesehir University';
insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Génie Civil','Civil Engineering','BACHELORS','ENGLISH',4800,3840,4 from public.universities where name='Atilim University';
insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Administration des Affaires (MBA)','MBA','MASTERS','ENGLISH',6000,4800,2 from public.universities where name='Atilim University';
insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Architecture','Architecture','BACHELORS','TURKISH',5200,null,4 from public.universities where name='Yasar University';
insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Relations Internationales','International Relations','BACHELORS','TURKISH',900,null,4 from public.universities where name='Ankara University';
insert into public.programs (university_id, name_fr, name_en, degree, language, tuition_fee_usd, discounted_agency_fee_usd, duration_years)
select id, 'Agronomie','Agricultural Engineering','BACHELORS','TURKISH',800,null,4 from public.universities where name='Ege University';

insert into public.city_living_costs (city_name, groceries_usd, transport_student_usd, utilities_usd, studio_rent_usd, shared_2bed_rent_usd, shared_3bed_rent_usd, private_dorm_usd) values
('Istanbul',200,25,80,600,320,230,350),
('Ankara',170,18,70,450,240,175,280),
('Izmir',180,20,70,480,260,185,300),
('Bursa',160,15,65,400,215,155,250),
('Antalya',175,18,70,470,250,180,290);

insert into public.document_guides (document_type,title_fr,description_fr,acquisition_steps_fr,where_to_get_it_fr,common_rejections_fr,is_required_for_visa,estimated_days,sort_order) values
('PASSPORT','Passeport','Passeport biométrique valide, obligatoire pour toute demande de visa étudiant.','1. Prendre rendez-vous à la police nationale. 2. Fournir acte de naissance + photos. 3. Payer les frais. 4. Retirer le passeport.','Direction Générale de la Police Nationale (Bamako, Dakar, Conakry, Abidjan).','Passeport expirant dans moins de 12 mois ; scan flou ou coupé ; page photo incomplète.',true,21,1),
('BAC_DIPLOMA','Diplôme du Baccalauréat','Attestation ou diplôme du baccalauréat, requis pour l''admission en licence.','1. Demander l''attestation au service des examens. 2. Faire légaliser par le MEN. 3. Faire légaliser par le MAECI.','Ministère de l''Éducation Nationale / Office du Baccalauréat.','Copie non légalisée ; cachet manquant ; photocopie de photocopie.',true,14,2),
('TRANSCRIPT','Relevé de Notes','Relevés de notes des trois dernières années du lycée.','1. Demander au secrétariat du lycée. 2. Faire signer et cacheter. 3. Légaliser.','Votre lycée d''origine.','Notes illisibles ; années manquantes ; absence de cachet.',true,7,3),
('FRENCH_TO_TURKISH_TRANSLATION','Traduction Assermentée (FR → TR/EN)','Traduction officielle de vos diplômes et relevés par un traducteur assermenté.','1. Réunir les originaux légalisés. 2. Confier à un traducteur assermenté. 3. Faire notarier la traduction.','Traducteurs assermentés agréés / notaire en Türkiye ou au consulat.','Traduction non notariée ; traducteur non agréé ; noms mal orthographiés.',true,5,4),
('DENKLIK_CERTIFICATE','Denklik Belgesi (Équivalence)','Certificat d''équivalence du diplôme délivré par les autorités turques.','1. Déposer le dossier au consulat de Türkiye. 2. Fournir diplôme + traduction. 3. Récupérer le Denklik.','Consulat/Ambassade de Türkiye ou Direction de l''Éducation en Türkiye.','Dossier incomplet ; diplôme non légalisé MAECI.',true,30,5),
('CASIER_JUDICIAIRE','Casier Judiciaire','Extrait de casier judiciaire de moins de 3 mois.','1. Se rendre au tribunal de première instance. 2. Payer le timbre. 3. Retirer l''extrait.','Tribunal de Première Instance de votre commune.','Document de plus de 3 mois ; non légalisé.',true,5,6),
('VISA_PHOTO','Photo Biométrique','Photos d''identité format visa, fond blanc.','1. Studio photo agréé. 2. Format 5x6 cm, fond blanc, récentes.','Studios photo agréés visa.','Fond coloré ; photo ancienne ; lunettes ou couvre-chef.',true,1,7),
('ACCEPTANCE_LETTER','Lettre d''Acceptation','Lettre d''admission délivrée par l''université turque.','Délivrée par l''université après validation du dossier par notre agence.','Université turque (via l''agence).','Lettre conditionnelle non convertie ; nom différent du passeport.',true,10,8),
('PAYMENT_RECEIPT','Reçu de Paiement','Justificatif de paiement des frais d''agence ou de scolarité.','1. Effectuer le paiement (Mobile Money / banque). 2. Conserver le reçu. 3. Téléverser une photo nette.','Orange Money, Wave, banque locale, ou bureau de l''agence.','Reçu illisible ; montant ou référence masqué.',false,1,9);
