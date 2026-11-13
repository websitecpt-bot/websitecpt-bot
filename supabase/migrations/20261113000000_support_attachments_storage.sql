-- Private Storage bucket for Support Inbox uploads.
-- Customer access is limited to their own support ticket folders.
-- Admin access requires an authenticated public.users profile with admin/superadmin role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only the owner of the support ticket or an admin can upload.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Support attachments: upload own ticket or admin'
  ) then
    execute $policy$
      create policy "Support attachments: upload own ticket or admin"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'support-attachments'
        and (
          exists (
            select 1
            from public.support_tickets st
            where st.id = (storage.foldername(name))[1]
              and lower(coalesce(st.user_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
          or exists (
            select 1
            from public.users u
            where lower(coalesce(u.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
              and u.role in ('admin', 'superadmin')
          )
        )
      )
    $policy$;
  end if;
end
$$;

-- Only the owner of the ticket or an admin can preview/download its files.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Support attachments: read own ticket or admin'
  ) then
    execute $policy$
      create policy "Support attachments: read own ticket or admin"
      on storage.objects for select to authenticated
      using (
        bucket_id = 'support-attachments'
        and (
          exists (
            select 1
            from public.support_tickets st
            where st.id = (storage.foldername(name))[1]
              and lower(coalesce(st.user_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
          or exists (
            select 1
            from public.users u
            where lower(coalesce(u.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
              and u.role in ('admin', 'superadmin')
          )
        )
      )
    $policy$;
  end if;
end
$$;
