
create policy "docs own read" on storage.objects for select to authenticated
  using (bucket_id = 'student-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));
create policy "docs own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'student-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid()) or public.has_role(auth.uid(),'AGENT')));
create policy "docs own update" on storage.objects for update to authenticated
  using (bucket_id = 'student-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));
create policy "docs own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'student-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));
