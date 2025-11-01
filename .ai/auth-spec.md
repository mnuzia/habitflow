# Specyfikacja Architektury Modułu Autentykacji

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### Zmiany w warstwie frontendu
W celu wdrożenia funkcjonalności rejestracji, logowania i odzyskiwania hasła, wprowadzimy nowe strony Astro w katalogu `src/pages/auth/` oraz rozszerzymy istniejące layouty i komponenty o mechanizmy autentykacji. 

- **Nowe strony Astro**:
  - `/auth/register.astro`: Strona rejestracji, renderowana po stronie serwera (SSR) z formularzem do podania emaila. Po wysłaniu formularza, strona przekierowuje na `/auth/verify` po potwierdzeniu emaila.
  - `/auth/login.astro`: Strona logowania z formularzem email/hasło, SSR z walidacją wstępną.
  - `/auth/reset-password.astro`: Strona resetu hasła, SSR, z formularzem do podania emaila i linku resetującego.
  - `/auth/verify.astro`: Strona weryfikacji emaila (dla rejestracji i resetu), SSR, obsługująca token z emaila i formularz do ustawienia hasła.
  - `/auth/logout.astro`: Strona wylogowania, SSR, przekierowująca na stronę główną po wylogowaniu.

- **Rozszerzenia istniejących elementów**:
  - `src/layouts/Layout.astro`: Rozszerzony o sprawdzanie stanu autentykacji (auth vs non-auth). W trybie auth, layout wyświetla menu użytkownika z opcjami takimi jak "Wyloguj", "Profil", "Ustawienia". W trybie non-auth, pokazuje przyciski "Zaloguj się" i "Zarejestruj się". Używa middleware Astro do sprawdzania sesji przed renderowaniem.
  - `src/components/ui/button.tsx`: Istniejący komponent React rozszerzony o warianty dla przycisków autentykacji (np. "Zaloguj się", "Wyślij link resetujący").
  - Nowy komponent React: `src/components/AuthForm.tsx` – dynamiczny formularz React do obsługi interaktywnych formularzy autentykacji, integrujący się z Astro poprzez wyspy (islands).

- **Tryb auth i non-auth**:
  - W trybie non-auth, strony takie jak `/index.astro` renderują treści publiczne z wezwaniami do działania (CTA) do rejestracji/logowania.
  - W trybie auth, strony chronione (np. `/habits`, `/stats`) sprawdzają sesję w middleware i przekierowują na `/auth/login` jeśli nieautoryzowane.

### Rozdzielenie odpowiedzialności
- **Strony Astro**: Odpowiedzialne za renderowanie początkowe (SSR), routing i integrację z backendem Supabase Auth. Obsługują nawigację (przekierowania po sukcesie/błędzie) i statyczne elementy UI. Na przykład, `/auth/register.astro` wysyła żądanie do Supabase za pośrednictwem serwisu client-side, a następnie renderuje potwierdzenie.
- **Komponenty React (client-side)**: Używane do dynamicznych interakcji, takich jak walidacja formularzy w czasie rzeczywistym, obsługa CAPTCHA (integracja z reCAPTCHA) i animacje błędów. Komponent `AuthForm.tsx` obsługuje stany formularza, walidację (np. siła hasła) i wysyła dane do Supabase Auth via SDK. Integracja z Astro odbywa się poprzez wyspy, gdzie React renderuje tylko interaktywne części strony.
- **Integracja z backendem**: Astro middleware (`src/middleware/index.ts`) sprawdza sesję Supabase przed renderowaniem stron, podczas gdy React komponenty obsługują akcje użytkownika (np. submit formularza) z bezpośrednimi вызовami do Supabase clienta (`src/db/supabase.client.ts`).

### Walidacja i komunikaty błędów
- **Walidacja client-side**: W komponentach React – sprawdzanie formatu emaila (regex), siły hasła (długość ≥8, mieszane znaki), zgodności haseł. Komunikaty błędów wyświetlane w aria-live regions dla dostępności.
- **Walidacja server-side**: W endpointach API – rate-limiting (np. 5 żądań/min na IP), CAPTCHA walidacja via Supabase Edge Functions.
- **Komunikaty błędów**: Lokalizowane, np. "Nieprawidłowy email", "Hasło zbyt słabe", "Link wygasł (ważny 15 min)". Wyświetlane jako toasty lub inline w formularzach, z obsługą aria-live dla czytników ekranu.

### Obsługa scenariuszy
- **Rejestracja**: Użytkownik wpisuje email, walidacja client-side, wysłanie do Supabase – email weryfikacyjny. Po kliknięciu linku, formularz ustawienia hasła z walidacją siły.
- **Logowanie**: Formularz email/hasło, walidacja, logowanie via Supabase, utworzenie profilu jeśli nowy, przekierowanie do `/`.
- **Reset hasła**: Wysłanie emaila resetującego, walidacja tokena, ustawienie nowego hasła.
- **Wylogowanie**: Wywołanie Supabase logout, unieważnienie tokenów, przekierowanie.
- **Re-auth**: Dla krytycznych akcji, modal z ponownym logowaniem.

## 2. LOGIKA BACKENDOWA

### Struktura endpointów API i modeli danych
- **Endpointy API** (w `src/pages/api/auth/`):
  - `POST /api/auth/register`: Obsługuje rejestrację – przyjmuje email, inicjuje wysyłkę emaila weryfikacyjnego via Supabase.
  - `POST /api/auth/login`: Logowanie – przyjmuje email/hasło, zwraca sesję.
  - `POST /api/auth/reset-password`: Wysyła link resetujący.
  - `POST /api/auth/verify`: Weryfikuje token i ustawia hasło.
  - `POST /api/auth/logout`: Wylogowuje użytkownika.
- **Modele danych**:
  - Rozszerzenie `src/types.ts` o interfejsy: `RegisterRequest { email: string }`, `LoginRequest { email: string, password: string }`, `ResetRequest { email: string }`, `VerifyRequest { token: string, password: string }`.
  - Integracja z `src/db/database.types.ts` dla tabeli `profiles` – automatyczne tworzenie rekordu po pierwszej rejestracji.

### Mechanizm walidacji danych wejściowych
- Użycie biblioteki Zod w serwisach backendowych do walidacji schematów (np. email format, hasło siła).
- Rate-limiting via Supabase Edge Functions lub middleware Astro – limity na IP/użytkownika (np. 5/min dla rejestracji/resetu).
- CAPTCHA integracja (reCAPTCHA) w formularzach, walidowana server-side przed wysłaniem emaila.

### Obsługa wyjątków
- Standaryzowane błędy: { code: string, message: string }, np. "AUTH_RATE_LIMIT", "INVALID_TOKEN".
- Logowanie błędów do Supabase logs lub Sentry, z maskowaniem PII.
- Graceful handling: Dla wygasłych tokenów (≤15 min), zwrot błędu z opcją ponownego wysłania.

### Aktualizacja renderowania server-side
- W `astro.config.mjs`: Konfiguracja middleware do sprawdzania autentykacji przed SSR. Rozszerzenie o `experimental.middleware` do obsługi sesji Supabase w trybie SSR, zapewniając, że strony chronione renderują dane tylko dla autoryzowanych użytkowników. Użycie `defineMiddleware` do wstrzykiwania stanu sesji do props stron.

## 3. SYSTEM AUTENTYKACJI

### Wykorzystanie Supabase Auth
- **Rejestracja**: Wywołanie `supabase.auth.signUp({ email, password: null })` do wysłania emaila weryfikacyjnego (≤15 min). Po weryfikacji, `supabase.auth.updateUser({ password })` ustawia hasło. Rate-limit i CAPTCHA w Edge Function.
- **Logowanie**: `supabase.auth.signInWithPassword({ email, password })`, walidacja siły hasła client-side, rate-limit server-side.
- **Wylogowanie**: `supabase.auth.signOut()`, unieważniające refresh tokens; opcja "wyloguj wszędzie" via Supabase admin API.
- **Reset hasła**: `supabase.auth.resetPasswordForEmail(email)`, wysyłający link (≤15 min). Po tokenie, `supabase.auth.updateUser({ password })`.
- **Re-auth i sesje**: Użycie `supabase.auth.reauthenticate()` dla krytycznych akcji. Sesje odświeżane automatycznie via SDK, z middleware Astro do sprawdzania sesji w SSR.
- **Integracja z Astro**: Użycie `src/db/supabase.client.ts` dla client-side auth, i server-side w API routes. Middleware (`src/middleware/index.ts`) integruje Supabase sesje z Astro request lifecycle, umożliwiając ochronę tras.

Ta architektura zapewnia zgodność z US-001, integrując Supabase Auth z Astro/React bez naruszania istniejącej struktury projektu, takiej jak middleware i typy danych.
