# Dokument wymagań produktu (PRD) - HabitFlow
## 1. Przegląd produktu
HabitFlow to progresywna aplikacja webowa (PWA) do budowania nawyków z naciskiem na niezawodny tryb offline, obsługę nawyków ilościowych, tygodniowych celów X/tydz., dostępność a11y, eksporty danych oraz zgodność z RODO. System obejmuje aplikację kliencką (Astro/React), backend na Supabase/Postgres (Auth, DB, Edge Functions), kolejkę offline z IndexedDB, materiałowane widoki statystyk, feed ICS oraz prywatne tokeny dostępu do API v0 (PAT). Wymagania uwzględniają trash/undo, DSAR z mechanizmem wznowień, bezpieczeństwo i płatny plan Pro w kolejnych etapach.

Zakres MVP obejmuje: tworzenie/edycję/archiwizację nawyków, odhaczanie i porcjowane wpisy ilościowe, logikę X/tydz., tryb offline z synchronizacją i LWW, eksport CSV, tagi i filtrowanie, dostępność WCAG 2.1 AA, digest przypomnień, feed ICS read-only, prywatne API v0 read-only, kosz z przywracaniem, DSAR i polityki prywatności, oraz procesy canary/rollback.

## 2. Problem użytkownika
Użytkownicy chcą śledzić nawyki w prosty i niezawodny sposób na wielu urządzeniach, także bez internetu. Potrzebują:
- szybkiego odhaczania i wsparcia dla nawyków ilościowych (np. 2 L wody, 10k kroków),
- tygodniowych celów X/tydz. z mikro-coachingiem i oceną ryzyka,
- wiarygodnych statystyk i heatmapy z trybami wysokiego kontrastu/daltonistycznym,
- bezbłędnej synchronizacji między urządzeniami i odporności na konflikty/TZ/DST,
- eksportu danych i zgodności z RODO (DSAR, RTBF, polityki retencji),
- nieinwazyjnych przypomnień (digest/ICS) bez zalewu powiadomień,
- możliwości odwracania błędów (trash/undo) i importu z innych trackerów,
- przejrzystości planu Free/Pro oraz bezpieczeństwa danych.

## 3. Wymagania funkcjonalne
3.1 PWA i wsparcie przeglądarek
- Instalowalność PWA z Lighthouse PWA ≥ 90, HTTPS, manifest z ikonami 192/512 i maskowalnymi, SW z cache offline.
- SSR dla strony startowej, offline read-only dla /, /habits, /stats.
- Support matrix: Desktop Chrome LTS + 2, Edge 2, Firefox 2, Safari 2; Mobile iOS 16+ Safari, Android 11+ Chrome.

3.2 Tryb offline i synchronizacja
- Kolejka komend w IndexedDB z idempotencją uuid, FIFO, exponential backoff do 60 s, retry do skutku.
- Kompresja kolejki: łączenie CHECK/UNCHECK oraz batching porcji w oknie 60 s.
- Konflikty: Last-Write-Wins wg server_received_at/logicalClock. Baner statusu offline/awarii; opcja Wyślij ponownie.

3.3 Model danych i bezpieczeństwo
- Tabele: profiles, habits, checkins (wiele porcji/dzień), sync_log, habit_params (wersjonowanie targetów), tag_catalog/tag_aliases, pat_tokens, consents, notifications, ics_rotations, logs audytowe.
- RLS: user_id = auth.uid() na tabelach i widokach z security_invoker. Rate limit mutacji 30/min/user.
- Szyfrowanie at-rest (dostawca); etap 2: opcjonalne szyfrowanie aplikacyjne wybranych pól.

3.4 Ilościowe nawyki i X/tydz.
- Jednostki bazowe: ml, m, s, szt.; konwersje UI; walidacja i clamp do value_min/value_max.
- Definicja completed(day): value_sum ≥ target_value (albo 1 dla binarnych).
- X/tydz.: done = liczba dni completed w tygodniu ISO; progress = min(done/X,1); nudges i stany ryzyka.

3.5 Edycja i kasowanie z koszem
- Backfill edycji porcji ≤ 3 dni; dzienny dziennik porcji z Edytuj/Usuń.
- Trash 7 dni dla habits i checkins z restore snapshotem i rozwiązywaniem kolizji.
- Hard delete po purgu z kosza; audyt i rekalkulacje agregatów zakresowo.

3.6 Tagi i filtrowanie
- habits.tags JSONB max 3 z katalogu wersjonowanego; indeks GIN; filtrowanie na Dzisiaj i Statystyki.
- Aliasowanie stary→nowy z effective_from; metryki adopcji aliasów.

3.7 Eksporty i importy
- Eksport CSV: schema_version=2, value_sum i completed, UTF-8 BOM, limit rozmiaru i ZIP; opcja raw log.
- Import CSV v2: dry-run z fuzzy (Jaro-Winkler), jednostki, clamp, dedup po source_uuid, tag_map z wersjonowaniem; undo importu do 7 dni.

3.8 ICS i powiadomienia
- Feed ICS per użytkownik z rotacją tokenu, all-day dla X/tydz., dzienne o godzinie digesta; UID stabilny per user/habit/date.
- Digest push: jedno powiadomienie dziennie z top brakujących; ciche godziny i ciche dni; kolizje ICS vs digest rozwiązywane na korzyść digesta.

3.9 API v0 i PAT
- Read-only endpointy day/week/export z PAT i limitami planu; HMAC podpis, ETag, rate limit, IP/ASN allowlist, dual-keys.
- Kontrakty błędów i paginacja, lokalizacja komunikatów.

3.10 DSAR i prywatność
- Formularz DSAR z re-auth i CAPTCHA; kolejka z priorytetami, SLA: potwierdzenie ≤7 dni, dostarczenie ≤30 dni (+30).
- Paczki ZIP szyfrowane KMS; opcjonalnie ZIP AES-256 z hasłem jednorazowym; manifest z checksumami.
- Mechanizm RESUME: checkpointy, partial deliver, limity wznowień, 410 Gone po restarcie.
- RTBF: scheduled_for_deletion_until 7 dni z oknem przywracania, purge markers dla DR; komunikacja i audyt.

3.11 A11y, dostępność poznawcza i skróty
- WCAG 2.1 AA, tryb daltonistyczny/wysokiego kontrastu heatmapy, focus mode, prefers-reduced-motion, larger fonts.
- Skróty klawiaturowe z panelami pomocy, aria-live dla sukcesów/błędów.

3.12 Observability, canary i SLO
- Sentry na froncie, PostHog; guardraile canary per segment/region/slot; auto-rollback.
- Budżety performance: LCP/INP/CLS; SLO UX: ttf_check ≤60 s, toggle ≤150 ms, render_today ≤1.5 s.

3.13 Limity planów Free vs Pro
- Free: 1 ICS, 1 PAT bez export scope, Export ≤90 dni.
- Pro: do 3 ICS, do 5 PAT (w tym read:export), Export ≤24 mies., kolejki priorytetowe.

## 4. Granice produktu
- Brak dwukierunkowej synchronizacji z kalendarzami (ICS read-only).
- Brak natywnych integracji Health/Fit w MVP.
- Brak publicznego API mutującego w v0.
- Szyfrowanie aplikacyjne wybranych pól dopiero w etapie 2.
- AI coaching pod flagą beta, poza zakresem krytycznych wymagań MVP.

## 5. Historyjki użytkowników
US-001
Tytuł: Rejestracja i logowanie z hasłem
Opis: Jako użytkownik chcę rejestrować się podając email, potwierdzać go i ustawiać hasło, oraz logować się za pomocą email/hasło, aby uzyskać dostęp do aplikacji.
Kryteria akceptacji:
- Rejestracja: Użytkownik podaje email, otrzymuje email weryfikacyjny ważny ≤15 min z rate-limitami i CAPTCHA; po potwierdzeniu ustawia hasło.
- Logowanie: Standardowe z email/hasło, z walidacją siły hasła i rate-limitami.
- Po udanym logowaniu następuje utworzenie profilu (jeśli nowy użytkownik).
- Reset hasła: Użytkownik podaje email, otrzymuje email resetujący ważny ≤15 min z rate-limitami; po potwierdzeniu ustawia nowe hasło z walidacją siły.
- Wymagane re-auth dla krytycznych akcji (delete account, DSAR, rotacja ICS/PAT).
- Sesje odświeżane w tle, wyloguj wszędzie unieważnia refresh tokens.

US-002
Tytuł: Onboarding z szablonami
Opis: Jako nowy użytkownik chcę wybrać 1–3 szablony nawyków i ustawić godzinę digesta.
Kryteria akceptacji:
- Kreator ≤3 kroki z propozycjami PL/EN.
- Po zakończeniu widzę listę Dzisiaj i mogę od razu odhaczać.
- Zdarzenia telemetryczne template_selected i A1.

US-003
Tytuł: Dodanie nawyku binarnego lub ilościowego
Opis: Jako użytkownik chcę dodać nawyk z częstotliwością DAILY/WEEKLY/TIMES_PER_WEEK i parametrami ilościowymi.
Kryteria akceptacji:
- Walidacja unit_kind, target_value, value_min/value_max.
- Tagi z whitelisty (max 3).
- Dla WEEKLY wybór dni tygodnia; dla X/tydz. wybór X.

US-004
Tytuł: Odhaczanie nawyku dzisiaj i wstecz
Opis: Jako użytkownik chcę odhaczać nawyki dziś i do 3 dni wstecz z zachowaniem trybu offline.
Kryteria akceptacji:
- Kliknięcie ✓ dodaje wpis porcji (value=1 lub suma batched).
- Offline kolejka zapisuje komendy; po powrocie online stan zgodny z LWW.
- Akcje starsze niż 3 dni są zablokowane z czytelnym komunikatem.

US-005
Tytuł: Wprowadzanie porcji ilościowych
Opis: Jako użytkownik chcę dodać porcję wody/kroków/czasu z odpowiednim krokiem UI.
Kryteria akceptacji:
- volume 0.1 L, distance 0.5 km, time 5 min, count 1.
- Wartości konwertowane do bazowych i clampowane do zakresów.
- Dzienny sum value_sum widoczny, completed(day) zgodnie z targetem.

US-006
Tytuł: Cel X razy w tygodniu z mikro-coachingiem
Opis: Jako użytkownik chcę widzieć progres tygodniowy i podpowiedzi, kiedy jestem w ryzyku niewyrobienia celu.
Kryteria akceptacji:
- Pasek progress = min(done/X,1) i stany plus/in_progress/at_risk.
- Nudges zależne od days_left i remaining.
- Nadwyżki z jednego dnia nie przenoszą się.

US-007
Tytuł: Edycja i usuwanie porcji wstecz
Opis: Jako użytkownik chcę edytować/usunąć pojedyncze porcje do 3 dni wstecz.
Kryteria akceptacji:
- Edycja aktualizuje value_sum i może zmienić completed(day).
- Preagregaty (tydzień/miesiąc) inwalidowane tylko w dotkniętym zakresie.
- Dostępne Undo dla porcji w koszu 7 dni.

US-008
Tytuł: Kosz i przywracanie nawyków/porcji
Opis: Jako użytkownik chcę przywrócić omyłkowo usunięte nawyki/porcje w 7 dni.
Kryteria akceptacji:
- Lista Trash z dniami do wygaśnięcia; przywrócenie odtwarza snapshot.
- Rozwiązanie kolizji: zmiana nazwy, scalenie (gdy kompatybilne) lub anulowanie.
- Purge po 7 dniach usuwa fizycznie dane.

US-009
Tytuł: Filtrowanie po tagach
Opis: Jako użytkownik chcę filtrować nawyki po tagach na Dzisiaj i Statystyki.
Kryteria akceptacji:
- Multi-select tagów z whitelisty; zapamiętanie wyboru.
- Aliasowanie tagów działa od effective_from w raportach.
- Metryka deprecated_tag_share i migration rate.

US-010
Tytuł: Heatmapa dostępna i czytelna
Opis: Jako użytkownik potrzebuję heatmapy z trybem daltonistycznym/wysokiego kontrastu i obsługą klawiatury.
Kryteria akceptacji:
- WCAG AA, aria-label per komórka, legenda dostępna klawiaturą.
- Skórki kolorystyczne zgodne z kontrastem.
- Navigacja klawiszami i widoczny focus.

US-011
Tytuł: Eksport danych
Opis: Jako użytkownik chcę wyeksportować dane do CSV/ZIP z wyborem zakresu i opcji raw log.
Kryteria akceptacji:
- Eksport standardowy i surowy; limity rozmiaru i stronicowanie/ZIP.
- Jednorazowy link 10 min, re-auth wymagany; log pobrań.
- Free: ≤90 dni; Pro: ≤24 miesiące.

US-012
Tytuł: Import danych z pliku CSV
Opis: Jako użytkownik chcę zaimportować dane z CSV z podglądem i korektą.
Kryteria akceptacji:
- Dry-run z fuzzy match, jednostki, clamp, dedup; lokalizowane raporty.
- Konflikty: manual vs imported; undo import batch do 7 dni.
- Mapowanie tagów z aliasami i wersjonowaniem tag_map.

US-013
Tytuł: Przypomnienia digest i ciche godziny/dni
Opis: Jako użytkownik chcę jedno dzienne przypomnienie z listą brakujących i szanowaniem cichych godzin/dni.
Kryteria akceptacji:
- Maks 1 push/h, grupowanie, deeplink do pierwszego nawyku.
- Quiet hours 22:00–07:00, silent_days. Opcja Pauzuj cele w ciche dni (prospektywna).
- Kolizje ICS vs digest rozstrzygane na korzyść digesta.

US-014
Tytuł: Feed ICS do kalendarza
Opis: Jako użytkownik chcę subskrybować feed ICS z moimi nawykami.
Kryteria akceptacji:
- Public token unguessable, rotacja i wyłączenie; 410 po rotacji.
- UID stabilny per user/habit/date; SEQUENCE przy edycjach; CANCEL/ PUBLISH przy merge.
- Rate limits i kompatybilność z Google/Apple/Outlook.

US-015
Tytuł: Prywatne API v0 z PAT
Opis: Jako użytkownik chcę pobierać moje metryki przez PAT.
Kryteria akceptacji:
- PAT z zakresami, TTL, rate limit, IP/ASN allowlist i HMAC; dual-keys z auto-end 24 h.
- MaxRangeDays egzekwowane wg planu; lokalizowane błędy i X-RateLimit.
- Anty-scraping i soft-block z komunikacją.

US-016
Tytuł: DSAR wniosek i paczka danych
Opis: Jako użytkownik chcę złożyć DSAR, śledzić postęp i pobrać paczkę z danymi.
Kryteria akceptacji:
- Re-auth, CAPTCHA; priorytety P1/P2; statusy received→in-progress→delivered(delivered_partial)→closed.
- Paczka ZIP z manifestem, checksums; opcjonalne hasło; single-use link 10 min.
- Self-check skrypt i wznowienia RESUME z limitami; 410 Gone po restarcie DSAR.

US-017
Tytuł: Przywracanie konta w oknie łaski
Opis: Jako użytkownik chcę cofnąć usunięcie konta w 7 dni.
Kryteria akceptacji:
- scheduled_for_deletion_until ustawione na +7 dni; e-mail z linkiem Restore.
- Po przywróceniu sesja odtworzona, ICS/PAT pozostają wyłączone do ręcznej aktywacji.

US-018
Tytuł: Ustawienia dostępności i tryb Skupienie
Opis: Jako użytkownik chcę włączyć tryb Skupienie, większe czcionki i ograniczyć animacje.
Kryteria akceptacji:
- Preferencje zapamiętane i działają niezależnie od systemu.
- Heatmapa i interakcje bez animacji przy reduced motion.
- Minimalny wskaźnik ryzyka dla X/tydz. w Focus mode.

US-019
Tytuł: Bezpieczne linki pobrań i unieważnienia
Opis: Jako użytkownik chcę bezpieczne, krótkotrwałe linki do pobierania eksportów/DSAR z możliwością unieważnienia po restarcie.
Kryteria akceptacji:
- Linki single-use, ważne 10 min; 410 i ERR_DSAR_RESTARTED po restarcie.
- Log downloads_invalidated i kanał źródłowy.

US-020
Tytuł: A11y komunikaty i skróty
Opis: Jako użytkownik korzystający z czytnika ekranu chcę zrozumiałe komunikaty i skróty.
Kryteria akceptacji:
- aria-live polite dla sukcesów, assertive dla błędów.
- Panel skrótów pod ?/h, bez kolizji systemowych; desktop-only.

US-021
Tytuł: Administracja DSAR i throttle
Opis: Jako operator prywatności chcę włączać globalny throttle DSAR i monitorować SLA.
Kryteria akceptacji:
- RBAC role dpo/privacy_operator; dziennik dsar_throttle_changed.
- Nowe wnioski w trybie low-impact; trwające przełączane przy checkpointcie.
- Dashboard statusów i ETA; eksport logu audytowego.

US-022
Tytuł: Rotacja/wyłączenie ICS i PAT
Opis: Jako użytkownik chcę w każdej chwili zrotować lub wyłączyć ICS/PAT.
Kryteria akceptacji:
- Natychmiastowa nieważność starych tokenów; 410 dla starych feedów.
- UI pokazuje ostatnie użycie i stan; cooldowny i komunikaty nadużyć.
- Audyt rotations i access logi.

US-023
Tytuł: Lokalizacja językowa i liczby
Opis: Jako użytkownik chcę UI w PL/EN i poprawne formaty liczb.
Kryteria akceptacji:
- Parser niezależny od UI akceptuje 2,5 i 2.5; CSV zawsze z kropką.
- Zmiana języka nie gubi wartości formularzy.

US-024
Tytuł: Canary rollout bez zakłóceń
Opis: Jako użytkownik nie powinienem widzieć zbędnych banerów przy zmianach między sesjami.
Kryteria akceptacji:
- Baner tylko przy zmianie flag runtime w sesji; w innych wypadkach changelog.
- Brak wpływu na działanie; metryki p95 monitorowane w tle.

US-025
Tytuł: Odzyskanie zaufania urządzenia
Opis: Jako użytkownik chcę łatwo przywrócić zaufanie urządzenia po wykryciu zmian.
Kryteria akceptacji:
- Notyfikacja o utracie zaufania z powodem; re-trust via OTP/WebAuthn.
- Widok trusted devices z możliwością usunięcia/re-prowizji.

US-026
Tytuł: Eksport vs DSAR routing
Opis: Jako użytkownik chcę prostą decyzję czy użyć eksportu czy DSAR.
Kryteria akceptacji:
- Router w /privacy prowadzi do właściwej ścieżki z opisem limitów/SLA.
- Telemetria privacy_router_used.

US-027
Tytuł: Bezpieczne uwierzytelnianie do akcji wrażliwych
Opis: Jako użytkownik chcę dodatkowego potwierdzenia przy akcjach krytycznych.
Kryteria akceptacji:
- Re-auth przed delete account, rotacją ICS/PAT, eksportem, DSAR.
- Dla P1 RTBF możliwy 2FA challenge (kod e-mail/SMS).

## 6. Metryki sukcesu
- Aktywacja A1: odsetek nowych użytkowników, którzy w 7 dni stworzą ≥1 nawyk i wykonają ≥3 completion.
- Retencja: D1/D7/D30, WAU, średnia długość streaku.
- Completion rate tygodniowy i udział nawyków X/tydz. spełnionych.
- PWA: installed_pwa, Lighthouse PWA ≥ 90, Accessibility ≥ 90.
- Wydajność: render_today p95 ≤ 1.5 s, toggle_latency p95 ≤ 150 ms, heatmapy ≤ 2.0 s.
- Niezawodność: error rate front < 1%, p95 API < 300 ms, uptime ≥ 99.5%.
- Eksport/DSAR: odsetek udanych eksportów, SLA potwierdzeń ≤7 dni, dostarczeń ≤30 dni, udział delivered_partial < docelowego progu.
- Bezpieczeństwo: incydenty nadużyć PAT/ICS, skuteczne rotacje/allowlist, zero wycieków PII.
- Koszt/MAU i limity budżetów dostawców w normie.
