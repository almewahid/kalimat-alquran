-- جدول رسائل المجموعة
create table if not exists group_messages (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references groups(id) on delete cascade,
  message_text text not null,
  user_id      uuid references auth.users(id) on delete set null,
  user_email   text,
  created_date timestamptz not null default now()
);

-- فهرس سريع على group_id للبحث السريع
create index if not exists group_messages_group_id_idx
  on group_messages(group_id, created_date desc);

-- RLS
alter table group_messages enable row level security;

-- أي مستخدم مسجل يستطيع قراءة رسائل المجموعة التي هو عضو فيها
create policy "أعضاء المجموعة يقرؤون الرسائل"
  on group_messages for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from groups g
      where g.id = group_messages.group_id
        and (
          g.leader_email = auth.email()
          or (g.members @> jsonb_build_array(jsonb_build_object('email', auth.email())))
        )
    )
  );

-- المستخدم المسجل يرسل رسائل فقط باسمه
create policy "المستخدم المسجل يرسل رسائل"
  on group_messages for insert
  with check (auth.uid() = user_id);
