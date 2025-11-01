# Schemat bazy danych PostgreSQL - HabitFlow

## 1. Lista tabel z kolumnami, typami danych i ograniczeniami

### profiles
Tabela profili użytkowników rozszerzająca auth.users z Supabase.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| user_id | uuid | PRIMARY KEY, REFERENCES auth.users(id) | ID użytkownika |
| email | text | NOT NULL | Email użytkownika |
| display_name | text | | Wyświetlana nazwa |
| timezone | text | DEFAULT 'UTC' | Strefa czasowa użytkownika |
| locale | text | DEFAULT 'en' | Język interfejsu (en/pl) |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| updated_at | timestamptz | DEFAULT now() | Data aktualizacji |
| deleted_at | timestamptz | | Soft delete timestamp |
| scheduled_for_deletion_until | timestamptz | | Okno łaski dla RTBF |

### habits
Tabela nawyków z soft delete i tagami.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| habit_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID nawyku |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Właściciel |
| name | text | NOT NULL | Nazwa nawyku |
| description | text | | Opis nawyku |
| frequency_type | text | NOT NULL CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'TIMES_PER_WEEK')) | Typ częstotliwości |
| target_value | numeric(10,3) | | Docelowa wartość (NULL dla binarnych) |
| unit_kind | text | CHECK (unit_kind IN ('count', 'volume', 'distance', 'time')) | Jednostka bazowa |
| value_min | numeric(10,3) | | Minimalna wartość |
| value_max | numeric(10,3) | | Maksymalna wartość |
| tags | jsonb | DEFAULT '[]' CHECK (jsonb_array_length(tags) <= 3) | Tablica tagów (max 3) |
| week_days | integer[] | | Dni tygodnia dla WEEKLY (1-7, ISO) |
| times_per_week | integer | | X dla TIMES_PER_WEEK |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| updated_at | timestamptz | DEFAULT now() | Data aktualizacji |
| deleted_at | timestamptz | | Soft delete timestamp |
| trash_expires_at | timestamptz | | Wygaśnięcie kosza |

### habit_params
Wersjonowanie parametrów nawyków z zakresami czasowymi.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| param_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID parametru |
| habit_id | uuid | NOT NULL, REFERENCES habits(habit_id) | Należący nawyk |
| effective_from | date | NOT NULL | Data obowiązywania od |
| effective_until | date | | Data obowiązywania do (NULL = aktualny) |
| target_value | numeric(10,3) | | Docelowa wartość |
| value_min | numeric(10,3) | | Minimalna wartość |
| value_max | numeric(10,3) | | Maksymalna wartość |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |

**Ograniczenie:** EXCLUDE (habit_id WITH =, daterange(effective_from, effective_until, '[]') WITH &&) USING gist

### checkin_portions
Atomowe porcje check-in'ów z metadanymi dla idempotencji.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| portion_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID porcji |
| habit_id | uuid | NOT NULL, REFERENCES habits(habit_id) | Należący nawyk |
| local_date | date | NOT NULL | Data lokalna (wg TZ użytkownika) |
| value | numeric(10,3) | NOT NULL DEFAULT 1 | Wartość porcji |
| note | text | | Notatka do porcji |
| client_command_uuid | uuid | NOT NULL | UUID komendy klienta (idempotencja) |
| device_id | text | | ID urządzenia |
| logical_clock | bigint | DEFAULT 0 | Zegar logiczny dla LWW |
| server_received_at | timestamptz | DEFAULT now() | Czas odbioru na serwerze |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| updated_at | timestamptz | DEFAULT now() | Data aktualizacji |
| deleted_at | timestamptz | | Soft delete timestamp |
| trash_expires_at | timestamptz | | Wygaśnięcie kosza |

**Ograniczenie:** UNIQUE (habit_id, client_command_uuid) - idempotencja

### tag_catalog
Katalog dozwolonych tagów.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| tag_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID tagu |
| name | text | NOT NULL UNIQUE | Nazwa tagu |
| display_name | jsonb | NOT NULL | Nazwy wyświetlane ({"en": "...", "pl": "..."}) |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |

### tag_aliases
Aliasowanie tagów z datami obowiązywania.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| alias_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID aliasu |
| old_tag | text | NOT NULL | Stara nazwa tagu |
| new_tag | text | NOT NULL | Nowa nazwa tagu |
| effective_from | date | NOT NULL | Data obowiązywania aliasu |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |

### pat_tokens
Personal Access Tokens dla API v0.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| token_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID tokenu |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Właściciel |
| name | text | NOT NULL | Nazwa tokenu |
| token_hash | text | NOT NULL | Hash tokenu (SHA-256) |
| token_last8 | text | NOT NULL | Ostatnie 8 znaków dla identyfikacji |
| scopes | text[] | NOT NULL DEFAULT '{}' | Zakresy dostępu |
| ttl_hours | integer | DEFAULT 24 | Czas życia w godzinach |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| expires_at | timestamptz | GENERATED ALWAYS AS (created_at + interval '1 hour' * ttl_hours) STORED | Data wygaśnięcia |
| revoked_at | timestamptz | | Data unieważnienia |
| last_used_at | timestamptz | | Data ostatniego użycia |

### pat_token_allows
Allowlist dla PAT (IP/ASN).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| allow_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID reguły |
| token_id | uuid | NOT NULL, REFERENCES pat_tokens(token_id) | Należący token |
| allow_type | text | NOT NULL CHECK (allow_type IN ('ip', 'asn')) | Typ reguły |
| allow_value | text | NOT NULL | Wartość (CIDR lub ASN) |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |

### ics_tokens
Tokeny dla ICS feed.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| token_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID tokenu |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Właściciel |
| name | text | NOT NULL | Nazwa tokenu |
| token_hash | text | NOT NULL | Hash tokenu (SHA-256) |
| token_last8 | text | NOT NULL | Ostatnie 8 znaków dla identyfikacji |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| revoked_at | timestamptz | | Data unieważnienia |
| last_used_at | timestamptz | | Data ostatniego użycia |

### dsar_requests
Żądania dostępu do danych (DSAR).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| request_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID żądania |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Zgłaszający |
| request_type | text | NOT NULL CHECK (request_type IN ('access', 'delete', 'rectify')) | Typ żądania |
| status | text | NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_progress', 'delivered', 'delivered_partial', 'closed')) | Status |
| priority | text | NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')) | Priorytet |
| request_details | jsonb | | Szczegóły żądania |
| resume_checkpoint | jsonb | | Punkt wznowienia dla dużych zbiorów |
| throttle_mode | boolean | DEFAULT false | Czy w trybie throttled |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| updated_at | timestamptz | DEFAULT now() | Data aktualizacji |
| delivered_at | timestamptz | | Data dostarczenia |
| closed_at | timestamptz | | Data zamknięcia |

### download_links
Linki do jednorazowych pobrań (eksport/DSAR).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| link_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID linku |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Właściciel |
| request_id | uuid | REFERENCES dsar_requests(request_id) | Powiązane DSAR (NULL dla eksportu) |
| link_token | text | NOT NULL | Token linku (unguessable) |
| file_path | text | NOT NULL | Ścieżka do pliku |
| file_name | text | NOT NULL | Nazwa pliku |
| file_size_bytes | bigint | | Rozmiar pliku |
| content_type | text | DEFAULT 'application/zip' | Typ MIME |
| password_hash | text | | Hash hasła (jeśli chronione) |
| expires_at | timestamptz | NOT NULL | Wygaśnięcie linku |
| downloaded_at | timestamptz | | Data pobrania |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |

### consents
Zgody użytkowników na przetwarzanie danych.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| consent_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID zgody |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Użytkownik |
| consent_type | text | NOT NULL | Typ zgody (marketing, analytics, etc.) |
| granted | boolean | NOT NULL | Czy udzielona |
| consent_text | text | NOT NULL | Tekst zgody |
| consent_version | text | NOT NULL | Wersja zgody |
| granted_at | timestamptz | | Data udzielenia |
| revoked_at | timestamptz | | Data cofnięcia |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |

### notifications
Ustawienia powiadomień i digest.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| notification_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID ustawienia |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Użytkownik |
| type | text | NOT NULL CHECK (type IN ('digest', 'reminder')) | Typ powiadomienia |
| enabled | boolean | DEFAULT true | Czy włączone |
| digest_hour | integer | CHECK (digest_hour >= 0 AND digest_hour <= 23) | Godzina digesta |
| quiet_hours_start | integer | DEFAULT 22 CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23) | Początek cichych godzin |
| quiet_hours_end | integer | DEFAULT 7 CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23) | Koniec cichych godzin |
| silent_days | integer[] | DEFAULT '{}' | Ciche dni tygodnia (1-7, ISO) |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| updated_at | timestamptz | DEFAULT now() | Data aktualizacji |

### audit_logs
Logi audytowe dla kluczowych operacji.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| log_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID logu |
| user_id | uuid | REFERENCES profiles(user_id) | Dotyczący użytkownik |
| action | text | NOT NULL | Akcja (create_habit, delete_account, etc.) |
| resource_type | text | NOT NULL | Typ zasobu |
| resource_id | uuid | | ID zasobu |
| old_values | jsonb | | Stare wartości |
| new_values | jsonb | | Nowe wartości |
| ip_address | inet | | Adres IP |
| user_agent | text | | User agent |
| created_at | timestamptz | DEFAULT now() | Data zdarzenia |

### sync_log
Log synchronizacji dla debugowania offline (opcjonalny).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|-------------|------|
| sync_id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | ID wpisu |
| user_id | uuid | NOT NULL, REFERENCES profiles(user_id) | Użytkownik |
| device_id | text | NOT NULL | ID urządzenia |
| command_type | text | NOT NULL | Typ komendy |
| command_uuid | uuid | NOT NULL | UUID komendy |
| status | text | NOT NULL CHECK (status IN ('pending', 'applied', 'failed')) | Status |
| error_message | text | | Błąd jeśli failed |
| created_at | timestamptz | DEFAULT now() | Data utworzenia |
| applied_at | timestamptz | | Data zastosowania |

## 2. Relacje między tabelami

### Relacje 1:N
- profiles → habits (user_id)
- profiles → pat_tokens (user_id)
- profiles → ics_tokens (user_id)
- profiles → dsar_requests (user_id)
- profiles → download_links (user_id)
- profiles → consents (user_id)
- profiles → notifications (user_id)
- profiles → audit_logs (user_id)
- profiles → sync_log (user_id)
- habits → habit_params (habit_id)
- habits → checkin_portions (habit_id)
- pat_tokens → pat_token_allows (token_id)
- dsar_requests → download_links (request_id)

### Relacje 1:1
- Brak bezpośrednich relacji 1:1

### Relacje N:N
- habits ↔ tag_catalog (przez tags JSONB w habits, nie wymaga tabeli łączącej)

## 3. Indeksy

### Indeksy podstawowe (automatyczne na PRIMARY KEY)

### Indeksy dodatkowe dla wydajności
```sql
-- habits
CREATE INDEX idx_habits_user_deleted ON habits(user_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_habits_tags ON habits USING gin(tags);
CREATE INDEX idx_habits_updated ON habits(updated_at DESC);

-- habit_params
CREATE INDEX idx_habit_params_habit_date ON habit_params(habit_id, effective_from, effective_until);
CREATE INDEX idx_habit_params_date_range ON habit_params USING gist(daterange(effective_from, effective_until, '[]'));

-- checkin_portions
CREATE INDEX idx_checkin_portions_habit_date ON checkin_portions(habit_id, local_date DESC);
CREATE INDEX idx_checkin_portions_user_date ON checkin_portions(habit_id, local_date DESC) 
  WHERE deleted_at IS NULL; -- wymaga funkcji zwracającej user_id z habit_id
CREATE INDEX idx_checkin_portions_client_uuid ON checkin_portions(client_command_uuid);
CREATE INDEX idx_checkin_portions_logical_clock ON checkin_portions(habit_id, logical_clock DESC);
CREATE INDEX idx_checkin_portions_deleted ON checkin_portions(deleted_at) WHERE deleted_at IS NULL;

-- pat_tokens
CREATE INDEX idx_pat_tokens_user_active ON pat_tokens(user_id, expires_at DESC) 
  WHERE revoked_at IS NULL AND expires_at > now();

-- ics_tokens
CREATE INDEX idx_ics_tokens_user_active ON ics_tokens(user_id, created_at DESC) 
  WHERE revoked_at IS NULL;

-- dsar_requests
CREATE INDEX idx_dsar_requests_user_status ON dsar_requests(user_id, created_at DESC);
CREATE INDEX idx_dsar_requests_priority_status ON dsar_requests(priority, status, created_at);

-- download_links
CREATE INDEX idx_download_links_token ON download_links(link_token);
CREATE INDEX idx_download_links_expires ON download_links(expires_at) WHERE downloaded_at IS NULL;

-- audit_logs
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

## 4. Zasady PostgreSQL (RLS)

### Włączanie RLS na wszystkich tabelach danych użytkownika
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_portions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pat_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pat_token_allows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ics_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsar_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
```

### Polityki RLS

#### profiles
```sql
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Brak INSERT/DELETE - zarządzane przez Supabase Auth
```

#### habits
```sql
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own habits" ON habits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete own habits" ON habits
  FOR UPDATE USING (user_id = auth.uid());
```

#### habit_params
```sql
CREATE POLICY "Users can view own habit params" ON habit_params
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM habits WHERE habit_id = habit_params.habit_id 
            AND user_id = auth.uid() AND deleted_at IS NULL)
  );

CREATE POLICY "Users can manage own habit params" ON habit_params
  FOR ALL USING (
    EXISTS (SELECT 1 FROM habits WHERE habit_id = habit_params.habit_id 
            AND user_id = auth.uid() AND deleted_at IS NULL)
  );
```

#### checkin_portions
```sql
CREATE POLICY "Users can view own checkins" ON checkin_portions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM habits WHERE habit_id = checkin_portions.habit_id 
            AND user_id = auth.uid() AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can manage own checkins" ON checkin_portions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM habits WHERE habit_id = checkin_portions.habit_id 
            AND user_id = auth.uid() AND deleted_at IS NULL)
  );
```

#### pat_tokens
```sql
CREATE POLICY "Users can view own PATs" ON pat_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own PATs" ON pat_tokens
  FOR ALL USING (user_id = auth.uid());
```

#### Podobne polityki dla pozostałych tabel użytkownika
Polityki dla ics_tokens, dsar_requests, download_links, consents, notifications, sync_log
postępują zgodnie z tym samym wzorcem: `user_id = auth.uid()`

#### tag_catalog i tag_aliases (globalne)
```sql
-- Brak RLS - dostępne dla wszystkich użytkowników
```

#### audit_logs (tylko insert, widoczne dla adminów)
```sql
CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin policies dla odczytu - implementowane przez role RBAC
```

## 5. Dodatkowe uwagi i wyjaśnienia

### Materialized Views dla agregatów
```sql
-- Dzienny agregat checkins
CREATE MATERIALIZED VIEW checkins_daily AS
SELECT 
  cp.habit_id,
  cp.local_date,
  SUM(cp.value) as value_sum,
  COUNT(*) as portion_count,
  CASE 
    WHEN h.target_value IS NULL THEN CASE WHEN SUM(cp.value) >= 1 THEN 1 ELSE 0 END
    ELSE CASE WHEN SUM(cp.value) >= h.target_value THEN 1 ELSE 0 END
  END as completed,
  MAX(cp.server_received_at) as last_updated
FROM checkin_portions cp
JOIN habits h ON cp.habit_id = h.habit_id
WHERE cp.deleted_at IS NULL AND h.deleted_at IS NULL
GROUP BY cp.habit_id, cp.local_date, h.target_value;

-- Indeksy na MV
CREATE UNIQUE INDEX idx_checkins_daily_habit_date ON checkins_daily(habit_id, local_date);
CREATE INDEX idx_checkins_daily_date ON checkins_daily(local_date);
```

### Funkcje pomocnicze
- `get_user_timezone(user_id)` - zwraca timezone użytkownika
- `calculate_local_date(timestamp, timezone)` - konwertuje timestamp na local_date
- `is_habit_completed(habit_id, local_date)` - sprawdza completion
- `validate_habit_params()` - trigger walidujący parametry nawyków

### Strategia partycjonowania
- Rozpoczęcie od indeksów na local_date
- Partycjonowanie miesięczne dla checkin_portions po osiągnięciu 10M rekordów/rok
- Automatyczne tworzenie partycji przez pg_partman

### Backup i retencja
- Codzienne backup wszystkich tabel
- Retencja audit_logs: 7 lat
- Retencja checkin_portions: 2 lata (po agregacji)
- Automatyczne purge przez pg_cron

### Bezpieczeństwo
- Wszystkie tokeny przechowywane jako SHA-256 hash
- Rate limiting implementowane w Edge Functions
- Audit wszystkich wrażliwych operacji
- Maskowanie PII w logach

### Wydajność
- Zapytania o dzisiejsze nawyki: < 100ms
- Heatmapa: < 2s dla roku danych
- Eksport: strumieniowanie dla dużych zbiorów
- API v0: < 300ms p95
