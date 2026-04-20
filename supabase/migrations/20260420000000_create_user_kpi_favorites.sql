create table if not exists user_kpi_favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    organisation_id uuid not null references organisations(id) on delete cascade,
    kpi_key text not null,
    sort_order int not null default 0,
    created_at timestamptz not null default now(),
    constraint user_kpi_favorites_kpi_key_check check (
        kpi_key in (
            'revenue',
            'ebitda',
            'netResult',
            'cashFlow',
            'burnRate',
            'monthlyGrowthRate',
            'grossProfit',
            'grossMargin',
            'variableCosts',
            'contributionMargin',
            'liquidityRatio',
            'debtorDays'
        )
    ),
    unique (user_id, organisation_id, kpi_key)
);

create index if not exists user_kpi_favorites_user_organisation_sort_idx
    on user_kpi_favorites (user_id, organisation_id, sort_order);
