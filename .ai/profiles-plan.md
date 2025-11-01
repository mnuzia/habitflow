# API Endpoint Implementation Plan: Profiles (GET and PATCH /api/profiles/me)

## 1. Przegląd punktu końcowego

Endpointy te umożliwiają zarządzanie profilem bieżącego użytkownika: GET pobiera dane profilu, a PATCH pozwala na częściową aktualizację wybranych pól. Są one zintegrowane z Supabase dla autentykacji i bazy danych, z naciskiem na bezpieczeństwo RLS i walidację Zod, zgodnie ze stackiem technologicznym (Astro 5, Supabase, Zod) i regułami implementacji (używać supabase z context.locals, extract logic to services).

## 2. Szczegóły żądania

- Metoda HTTP: GET (dla pobierania) / PATCH (dla aktualizacji)
- Struktura URL: /api/profiles/me (dla obu; brak dynamicznych segmentów)
- Parametry:
  - Wymagane: Brak (dla obu endpoints; autentykacja implicite via Supabase)
  - Opcjonalne: Brak parametrów query (dla obu)
- Request Body: Dla GET - brak; Dla PATCH - JSON obiekt z opcjonalnymi polami: { "display_name": "string|optional", "timezone": "string|optional", "locale": "string|optional" } (używać UpdateProfileCommand z types.ts)

## 3. Szczegóły odpowiedzi

- Dla GET: 200 OK z JSON { "user_id": "uuid", "email": "string", "display_name": "string|null", "timezone": "string", "locale": "string", "created_at": "timestamptz", "updated_at": "timestamptz", "deleted_at": "timestamptz|null", "scheduled_for_deletion_until": "timestamptz|null" } (ProfileDto z types.ts)
- Dla PATCH: 200 OK z zaktualizowanym ProfileDto (jak powyżej)
- Inne kody: 400 Bad Request (nieprawidłowy input), 401 Unauthorized (brak autentykacji), 404 Not Found (profil nie istnieje), 500 Internal Server Error (błędy serwera)

## 4. Przepływ danych

1. Żądanie trafia do Astro API route w src/pages/api/profiles/me.ts (export const GET i PATCH).
2. Używać context.locals.supabase do autentykacji (getUser()) i zapytań.
3. Dla GET: Wywołać profileService.getProfile(userId) -> zapytanie SELECT z profiles WHERE user_id = auth.uid() (z RLS).
4. Dla PATCH: Walidować body Zod -> wywołać profileService.updateProfile(userId, validatedData) -> UPDATE profiles SET ... WHERE user_id = auth.uid() (z RLS), potem SELECT zaktualizowanego rekordu.
5. Zwrócić JSON z ProfileDto; logować operacje do audit_logs (action='get_profile' lub 'update_profile', z old/new_values).

## 5. Względy bezpieczeństwa

- Uwierzytelnianie: Wymagane via Supabase Auth (context.locals.supabase.auth.getUser()); zwrócić 401 jeśli brak sesji.
- Autoryzacja: RLS na profiles zapewnia dostęp tylko do własnego rekordu (user_id = auth.uid()).
- Walidacja: Zod dla PATCH body; sanitizować input (np. trim strings, validate timezone jako IANA, locale jako 'en'/'pl').
- Zagrożenia: Ochrona przed wstrzykiwaniem SQL (używać Supabase SDK); rate limiting via Supabase Edge; brak edycji wrażliwych pól (np. email); Astro middleware dla dodatkowych checków (np. CSRF jeśli potrzebne).
- Inne: Używać HTTPS; maskować PII w logach.

## 6. Obsługa błędów

- 400 Bad Request: Nieprawidłowy payload (np. nie-string w display_name) - zwrócić { error: "Validation failed", details: [...] }; early return w service.
- 401 Unauthorized: Brak autentykacji - zwrócić { error: "Unauthorized" }.
- 404 Not Found: Profil nie istnieje (rzadkie, ale jeśli Supabase Auth nie zsynchronizowany) - zwrócić { error: "Profile not found" }.
- 500 Internal Server Error: Błędy bazy/serwera (np. Supabase throw) - logować do audit_logs z error_message, zwrócić { error: "Internal server error" }; unikać ujawniania detali.
- Inne: 429 Too Many Requests jeśli rate limit; handle edge cases jak soft-deleted profile (filtr w query: deleted_at IS NULL).
- Logowanie: Insert do audit_logs dla błędów (action='profile_error', error_message); używać console.error dla dev.

## 7. Wydajność

- Wąskie gardła: Proste zapytania SELECT/UPDATE na profiles (mała tabela); potencjalne spowolnienie przy dużej liczbie użytkowników - optymalizować indeksami z db-plan (idx_habits_user_deleted, choć dla profiles brak specyficznych - dodać jeśli potrzeba).
- Optymalizacje: Używać Supabase cache jeśli dostępne; limitować response do niezbędnych pól; testować <100ms response time; dla skalowalności - partycjonowanie jeśli profiles rośnie (z db-plan strategy).
- Inne: Unikać niepotrzebnych zapytań; użyć materialized views jeśli przyszłe agregaty.

## 8. Kroki implementacji

1. Utwórz plik src/pages/api/profiles/me.ts z export const prerender = false; i handlerami GET/PATCH.
2. Zaimplementuj walidację Zod dla PATCH body w route (z.safeParse z schematem z UpdateProfileCommand).
3. Utwórz src/lib/services/profileService.ts z metodami getProfile i updateProfile, używając SupabaseClient do zapytań z error handling (early returns, guard clauses).
4. Zintegruj autentykację: W route pobrać user z context.locals.supabase.auth.getUser(); przekazać user.id do service.
5. Zaimplementuj logowanie do audit_logs w service dla sukcesów/błędów (używać insert z action, old_values, new_values).
6. Obsłuż błędy: Używać try-catch w service, mapować na kody stanu i friendly messages.
7. Przetestuj: Unit tests dla service (walidacja, edge cases); integration tests dla route (autentykacja, RLS).
8. Zaktualizuj dokumentację: Dodaj do .ai/api-plan.md i src/types.ts jeśli nowe typy; lint i fix errors.
9. Deploy: Używać GitHub Actions dla CI/CD, host na Vercel/AWS z Supabase integration.
