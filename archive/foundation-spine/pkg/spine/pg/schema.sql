create table if not exists spine_decisions (
    contract_id text primary key check (contract_id <> ''),
    payload bytea not null
);

create table if not exists spine_outbox (
    idempotency_key text primary key check (idempotency_key <> ''),
    contract_id text not null unique check (contract_id <> ''),
    event_payload bytea not null,
    relayed boolean not null default false,
    staged_at timestamptz not null
);

create index if not exists spine_outbox_pending_idx
    on spine_outbox (staged_at, idempotency_key)
    where not relayed;

create table if not exists spine_audit (
    sequence_no bigint generated always as identity primary key,
    entry_id text not null unique check (entry_id <> ''),
    tenant_id text not null check (tenant_id <> ''),
    payload bytea not null
);

create index if not exists spine_audit_tenant_sequence_idx
    on spine_audit (tenant_id, sequence_no);
