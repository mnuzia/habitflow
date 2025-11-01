# Specyfikacja Architektury Modułu Autentykacji w HabitFlow

Na podstawie wymagań z pliku PRD (szczególnie US-001 dotyczący rejestracji, logowania i resetu hasła) oraz stosu technologicznego (Astro 5 z React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase dla backendu), poniżej przedstawiam szczegółową architekturę modułu autentykacji. Specyfikacja jest zgodna z istniejącymi regułami projektu, w tym strukturą katalogów (src/pages, src/components, src/layouts, src/db, src/lib), wytycznymi dla Astro (SSR, middleware, cookies), backendu (Supabase Auth i klienci), frontendu (rozdzielenie Astro/React, Tailwind, a11y), React (funkcjonalne komponenty, hooks) oraz Shadcn/ui (komponenty UI). Nie narusza istniejącego działania aplikacji, np. hybrydowego renderowania, obsługi offline czy integracji z Supabase.

Specyfikacja skupia się na kluczowych elementach: interfejsie użytkownika, logice backendowej i systemie autentykacji. Wskazuje komponenty, moduły, serwisy i kontrakty bez docelowej implementacji kodu.

## 1. Architektura Interfejsu Użytkownika

### Opis Zmian w Warstwie Frontendu
- **Nowe Strony Astro (w src/pages/auth/)**: 
  - `register.astro`: Strona rejestracji z formularzem do podania emaila i hasła, obsługująca przekierowanie po wysłaniu emaila weryfikacyjnego.
  - `login.astro`: Strona logowania z formularzem email/hasło, linkiem do resetu hasła i obsługą błędów autentykacji.
  - `reset-password.astro`: Strona resetu hasła z formularzem do podania emaila (wysłanie linku resetującego) oraz formularzem do ustawienia nowego hasła po weryfikacji tokena.
  - `verify-email.astro`: Strona potwierdzenia emaila po kliknięciu w link weryfikacyjny, z automatycznym przekierowaniem do logowania lub dashboardu.
  - `logout.astro`: Prosta strona wylogowania (opcjonalnie, jeśli nie obsługiwana przez API), potwierdzająca wylogowanie i przekierowująca do strony głównej.
- **Rozszerzenie Istniejących Stron Astro (w src/pages/)**:
  - Strony jak `index.astro`, `habits.astro` czy `stats.astro` zostaną rozszerzone o sprawdzanie sesji w middleware (src/middleware/index.ts), blokując dostęp do treści autoryzowanych i wyświetlając komunikat "Zaloguj się" z linkiem do login.astro.
  - Dodanie warunkowego renderowania w layoutach: np. w `MainLayout.astro` (dla stron autoryzowanych) wyświetlanie przycisku "Wyloguj" i informacji o użytkowniku; w `AuthLayout.astro` (dla stron auth) ukrywanie nawigacji głównej.
- **Nowe Layouty Astro (w src/layouts/)**:
  - `AuthLayout.astro`: Dedykowany layout dla stron autentykacyjnych, z uproszczoną nawigacją (bez menu głównego), fokusem na formularzach i wsparciem dla a11y (ARIA landmarks jak role="main" dla formularza).
  - Rozszerzenie `MainLayout.astro`: Dodanie warunkowego bloku dla autoryzowanych użytkowników, np. wyświetlanie awatara użytkownika i menu dropdown z opcjami jak "Ustawienia" czy "Wyloguj".
- **Nowe Komponenty React (w src/components/)**:
  - `RegisterForm.tsx`: Interaktywny formularz React z polami email/hasło/powtórz hasło, przyciskiem submit i walidacją client-side.
  - `LoginForm.tsx`: Formularz React z polami email/hasło, przyciskiem submit i linkiem "Zapomniałeś hasła?".
  - `ResetPasswordForm.tsx`: Formularz React z polem email (dla żądania resetu) lub hasło/powtórz hasło (dla ustawiania nowego), obsługujący tokeny z URL.
  - `ErrorMessage.tsx`: Komponent Shadcn/ui (np. Alert) do wyświetlania błędów, z ARIA-live dla dostępności.
- **Rozszerzenie Istniejących Komponentów**:
  - Komponenty z src/components/ui/ (Shadcn/ui) jak Button, Input, Label zostaną użyte w nowych formularzach; rozszerzenie o warianty dark mode i responsive (Tailwind variants).
  - Istniejące komponenty jak Navigation.tsx rozszerzone o warunkowe linki (np. "Zaloguj się" vs "Wyloguj").

### Rozdzielenie Odpowiedzialności Między React i Astro
- **Strony Astro**: Odpowiadają za SSR (initial render, SEO, hybrydowe renderowanie), integrację z middleware dla sprawdzania sesji, nawigację (przekierowania po sukcesie/błędzie) i statyczne elementy (np. nagłówki, footery). Używają `context.locals.supabase` do interakcji z backendem bez bezpośredniego importu klienta Supabase.
- **Komponenty React (client-side)**: Odpowiadają za interaktywność formularzy (walidacja live, obsługa submit, focus management), hooks jak useState/useEffect dla stanu formularza i integrację z Supabase Auth via API calls (np. fetch do src/pages/api/auth). React nie używa "use client" (zgodne z regułami), ale jest ładowany dynamicznie w Astro dla interaktywności.
- **Integracja z Backendem i Nawigacją**: Formularze React wysyłają dane do endpointów API Astro (np. POST /api/auth/signup), obsługują odpowiedzi (np. via fetch) i triggerują nawigację Astro (np. location.href po sukcesie). Akcje użytkownika jak submit są idempotentne dla offline (kolejka w IndexedDB, ale dla auth priorytet na online).

### Walidacja i Komunikaty Błędów
- **Client-side Walidacja**: Używać Zod w React komponentach do walidacji (np. email format, hasło min. 8 znaków z walidacją siły). Błędy wyświetlane natychmiastowo pod polami (np. "Hasło musi mieć co najmniej 8 znaków") z ARIA-describedby.
- **Server-side Walidacja**: Powtórzona w endpointach API dla bezpieczeństwa.
- **Komunikaty Błędów**: Standaryzowane, lokalizowane (PL/EN), np. "Nieprawidłowy email lub hasło" (z ARIA-live assertive). Błędy Supabase mapowane na user-friendly (np. "Email już istnieje" zamiast surowego kodu błędu). Obsługa rate-limitów z komunikatem "Zbyt wiele prób, spróbuj za 5 minut".

### Obsługa Najważniejszych Scenariuszy
- Rejestracja: Formularz wysyła email/hasło, backend wysyła email weryfikacyjny (ważny 15 min), strona verify-email potwierdza i ustawia sesję.
- Logowanie: Formularz sprawdza email/hasło, ustawia sesję cookie, przekierowuje do /habits.
- Reset Hasła: Żądanie wysyła email resetujący (ważny 15 min), strona reset-password ustawia nowe hasło po tokenie.
- Wylogowanie: Wywołuje Supabase signOut, czyści sesję, przekierowuje do /.
- Re-auth dla Krytycznych Akcji: Modal React z ponownym logowaniem przed akcjami jak DSAR.
- Edge Cases: Offline (blokada auth z komunikatem), rate-limits (CAPTCHA po 3 próbach), dostępność (klawiatura, screen readers).

## 2. Logika Backendowa

### Struktura Endpointów API i Modeli Danych
- **Endpointy API (w src/pages/api/auth/)**:
  - `signup.ts`: POST handler dla rejestracji (parametry: email, password), zwraca { success, error }.
  - `signin.ts`: POST dla logowania (email, password), zwraca sesję lub błąd.
  - `signout.ts`: POST dla wylogowania, bez parametrów.
  - `reset-password.ts`: POST dla żądania resetu (email) i PATCH dla ustawienia nowego hasła (token, newPassword).
  - `verify-email.ts`: GET dla potwierdzenia emaila (token z URL).
- **Modele Danych (w src/types.ts i src/db/)**:
  - Rozszerzenie typów Supabase: `UserProfile` z polami jak user_id, email_verified; `AuthError` dla custom błędów.
  - Kontrakty: Input schemas Zod (np. SignupSchema: { email: string, password: string }), output { data: Session | null, error: AuthError | null }.

### Mechanizm Walidacji Danych Wejściowych
- Używać Zod w handlerach API do parsowania body/query (np. z.parse(SignupSchema, request.body)).
- Walidacja: Email format, hasło siła (min. 8 znaków, mix liter/cyfr), rate-limits (Supabase built-in + custom w middleware).
- Integracja z RODO: Logowanie zgód (consents table) przy rejestracji.

### Obsługa Wyjątków
- Guard clauses w handlerach: Wczesny return dla błędów (np. if (!email) return 400).
- Custom błędy: Mapowanie Supabase błędów na HTTP codes (401 Unauthorized, 429 Too Many Requests) z JSON response { message, code }.
- Logging: Używać console.error lub PostHog dla błędów, bez ujawniania detali użytkownikowi.

### Aktualizacja Sposobu Renderowania Wybranych Stron Server-Side
- W `astro.config.mjs`: Konfiguracja middleware do sprawdzania sesji dla tras autoryzowanych (np. adapter z SSR).
- Middleware (src/middleware/index.ts): Sprawdza sesję via supabase.auth.getSession(), dodaje do context.locals; redirect do login jeśli brak sesji dla stron jak /habits.
- Hybrydowe Renderowanie: Strony auth jako dynamiczne (prerender: false), główne jako SSR z cache dla non-auth.

## 3. System Autentykacji

- **Wykorzystanie Supabase Auth**: Integracja via SupabaseClient z src/db/supabase.client.ts (nie bezpośrednio z @supabase/supabase-js). Funkcje: auth.signUp dla rejestracji (z email confirmation), auth.signInWithPassword dla logowania, auth.signOut dla wylogowania, auth.resetPasswordForEmail dla resetu.
- **Połączenie z Astro**: Middleware injectuje supabase do context.locals dla SSR; API endpointy używają locals.supabase do autentykacji. Sesje przechowywane w cookies (Astro.cookies) z secure/httponly flagami.
- **Dodatkowe Mechanizmy**: Re-auth via auth.verifyOneTimePassword lub ponowne logowanie; rate-limits i CAPTCHA (Supabase edge functions); odświeżanie sesji w tle (refresh tokens); wyloguj wszędzie via auth.signOut(all: true).
- **Bezpieczeństwo**: RLS na tabelach (user_id = auth.uid()), audyt logów w sync_log, zgodność z RODO (retencja tokenów ≤15 min).

Ta architektura zapewnia zgodność z PRD, minimalizuje JavaScript client-side i priorytetuje a11y/offline.
