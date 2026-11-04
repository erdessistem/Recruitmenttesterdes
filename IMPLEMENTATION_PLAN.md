# Implementation Plan — Erdes Group Recruitment App

**Version:** 1.1  
**Date:** 2 November 2026  
**Status:** Approved — implementation in batches  
**UI language:** Bahasa Indonesia  
**Stack:** Next.js + TypeScript + Google Sheets + Vercel

---

## 1. Overview

### 1.1 Goal

Build a lightweight recruitment web app for Erdes Group that allows:

- Candidates to browse open vacancies and submit an application without creating an account.
- Candidates to receive an Applicant ID and track their recruitment progress.
- The superadmin to manage vacancies, review applicants, and move candidates through recruitment stages.
- Google Sheets to act as the database, keeping operational cost and maintenance low.

### 1.2 Success criteria

- A candidate can complete an application on a mobile phone in under 5 minutes.
- Every successful application receives a unique Applicant ID and a secret tracking link.
- A candidate can track progress using Applicant ID + WhatsApp number, recover a lost ID, and withdraw an application.
- The superadmin can create, edit, open, and close vacancies.
- The superadmin can view all applicants, read their form answers, update stages, add internal notes, and export CSV.
- All data is stored in a private Google Sheet and never exposed directly to the browser.
- The app is deployable on Vercel with a `*.vercel.app` domain.

### 1.3 Constraints

- Expected volume: maximum ~50 applications per month.
- Google Sheets is the only database. No transactions, no joins, no relational constraints.
- No email or WhatsApp automation at launch.
- No CV file uploads. CV is an optional URL.
- One superadmin account only.
- No candidate accounts or candidate login.
- Candidate email is optional and is not used for authentication.
- UI copy is in Bahasa Indonesia.
- Neutral visual design. UI will be redesigned later, so design tokens and components must be easy to replace.
- Node.js is not installed on the current development machine yet. Batch 1 covers tooling setup.
- Google Sheets, Vercel, and `.env.local` setup are performed by the project owner after all implementation batches are complete. Batches 1–6 run against the in-memory repository and seed data.

### 1.4 Key clarification: candidate identity

The candidate does **not** log in and does **not** have to provide an email address.

Therefore:

- Tracking uses **Applicant ID + WhatsApp number**.
- The direct tracking link contains a secret token and does not require the WhatsApp number.
- Lost-ID recovery uses **WhatsApp number + full name**. Email is optional and is not required for recovery.
- Duplicate prevention uses **WhatsApp number + vacancy**, not email.
- Email remains an optional field for future notifications and manual contact.

This resolves the earlier ambiguity around email-based tracking.

---

## 2. Scope

### 2.1 MVP scope

**Public**

- Careers landing page with open vacancies.
- Vacancy detail page.
- Application form, one universal form for all roles.
- Success page with Applicant ID, copy button, print view, WhatsApp share, and direct tracking link.
- Tracking page using Applicant ID + WhatsApp number.
- Direct tracking page using a secret token.
- Lost-ID recovery.
- Candidate withdrawal.
- Privacy notice page.

**Admin**

- Email + password login.
- Dashboard with key counts and pipeline summary.
- Vacancy management: create, edit, publish, close, archive.
- Applicant list with search and filters.
- Applicant detail with all form answers, CV link, timeline, and internal notes.
- Stage updates with mandatory history logging.
- Reject and reopen applications.
- Copy WhatsApp message templates.
- CSV export.
- Change password.
- Retention cleanup tool.
- Settings for company profile and WhatsApp templates.

### 2.2 Out of scope for MVP

- Candidate accounts, login, or profile management.
- Email or WhatsApp automation.
- CV/file upload and storage.
- Drag-and-drop kanban board.
- Custom form builder or per-vacancy questions.
- Interview scheduling and calendar integration.
- Multiple admin roles or admin user management UI.
- Analytics beyond simple counts and funnel.
- Offer letter generation.
- Talent pool.
- Multi-language UI.
- Native mobile app.

### 2.3 Future roadmap

- Email notifications via Resend/SendGrid.
- WhatsApp notifications via a local gateway.
- Interview scheduling with Google Calendar.
- Per-vacancy screening questions.
- Kanban pipeline.
- Interview scorecards.
- Talent pool for rejected-but-promising candidates.
- Google Sheets to Postgres/Supabase migration if volume grows.
- Audit log for all admin actions.

---

## 3. Roles and flows

### 3.1 Candidate flow

```text
Landing page
  -> Vacancy detail
  -> Application form
  -> Validation error? return to form with messages
  -> Success
       -> Applicant ID
       -> Secret tracking link
       -> Print / save proof
       -> Send to own WhatsApp
  -> Track application
       -> Applicant ID + WhatsApp
       -> OR secret token link
       -> View timeline and current stage
       -> Withdraw application
  -> Lost ID
       -> WhatsApp + full name
       -> See matching applications
```

### 3.2 Superadmin flow

```text
Login
  -> Dashboard
  -> Vacancies
       -> Create / edit
       -> Open / close / archive
  -> Applicants
       -> Filter by vacancy, stage, status, date
       -> Open applicant detail
            -> Read answers and CV
            -> Move stage
            -> Reject / reopen
            -> Add internal note
            -> Copy WhatsApp message
  -> Export CSV
  -> Settings
       -> Company profile
       -> WhatsApp templates
       -> Change password
       -> Retention cleanup
```

---

## 4. Pages and routes

### 4.1 Public routes

| Route | Purpose | Notes |
|---|---|---|
| `/` | Careers landing + open vacancies | Server-rendered, cached briefly |
| `/lowongan/[slug]` | Vacancy detail | Only open/valid vacancies are public |
| `/lowongan/[slug]/lamar` | Application form | No login, no account |
| `/lamaran/berhasil/[token]` | Success page | `noindex`, reads application by secret token |
| `/lacak` | Manual tracking form | Applicant ID + WhatsApp |
| `/lacak/[token]` | Direct tracking page | Secret link |
| `/lacak/cari` | Lost-ID recovery | WhatsApp + full name |
| `/privasi` | Privacy and data-use notice | Linked from consent checkbox |

### 4.2 Admin routes

| Route | Purpose | Auth |
|---|---|---|
| `/admin/login` | Login | Public |
| `/admin` | Dashboard | Protected |
| `/admin/lowongan` | Vacancy list | Protected |
| `/admin/lowongan/baru` | Create vacancy | Protected |
| `/admin/lowongan/[id]` | Edit vacancy | Protected |
| `/admin/pelamar` | Applicant list | Protected |
| `/admin/pelamar/[id]` | Applicant detail | Protected |
| `/admin/pelamar/export` | CSV export | Protected |
| `/admin/pengaturan` | Settings, password, retention | Protected |

### 4.3 Internal endpoints and actions

- Server actions handle form submissions and admin mutations.
- `GET /admin/pelamar/export` is a route handler that returns CSV.
- No public JSON API is required for MVP.
- All database access stays on the server.

---

## 5. Candidate experience

### 5.1 Landing page

- Hero with Erdes Group name and a short recruitment message.
- Search and filters: department, location, employment type.
- Vacancy cards showing title, department, location, type, and closing date.
- Empty state when no vacancies are open.
- Footer with privacy link and company contact.
- Only vacancies with status `open`, and within their open/close date window, are shown.

### 5.2 Vacancy detail

- Title, department, location, employment type, quota.
- Description and requirements, rendered as plain text with preserved line breaks.
- Opening and closing dates.
- Apply button.
- If closed: show a closed message and hide the apply button.
- If the vacancy does not exist: 404 page.

### 5.3 Application form

One universal form for all roles. No login. No email requirement.

**Form sections**

1. **Data Diri**
2. **Pendidikan dan Pengalaman**
3. **Lamaran**
4. **Persetujuan**

**Fields**

| Field | Label | Type | Required | Validation / notes |
|---|---|---|---|---|
| `full_name` | Nama lengkap | text | Yes | 2–100 characters |
| `whatsapp` | No. WhatsApp | tel | Yes | Accept `+62...`, `62...`, or `08...`; strip separators; normalize to `62...`; 10–15 digits |
| `email` | Email | email | No | Valid email if filled; max 150 characters |
| `city` | Kota domisili | text | Yes | 2–100 characters |
| `last_education` | Pendidikan terakhir | select | Yes | SMA/SMK, D3, S1, S2, S3, Lainnya |
| `major` | Jurusan | text | No | Max 100 characters |
| `experience_years` | Pengalaman kerja | number | Yes | Integer 0–60 |
| `last_company` | Perusahaan terakhir | text | No | Max 150 characters |
| `last_salary` | Gaji terakhir | currency | Yes | Integer IDR, minimum 0, maximum 1,000,000,000; helper: isi 0 jika belum pernah bekerja |
| `expected_salary` | Ekspektasi gaji | currency | Yes | Integer IDR, minimum 1, maximum 1,000,000,000 |
| `cv_url` | Link CV/portfolio | url | No | Must start with `https://`; max 500 characters |
| `linkedin_url` | LinkedIn | url | No | Must start with `https://`; max 300 characters |
| `motivation` | Motivasi melamar | textarea | Yes | 20–1,000 characters |
| `availability` | Ketersediaan mulai kerja | select | Yes | Segera, 2 minggu, 1 bulan, Lebih dari 1 bulan |
| `source` | Sumber informasi | select | Yes | Instagram, LinkedIn, Teman/keluarga, Website Erdes, Job portal, Lainnya |
| `source_other` | Sumber informasi lainnya | text | Conditional | Required when `source` = Lainnya; max 100 characters |
| `consent` | Persetujuan data | checkbox | Yes | Must be checked; links to `/privasi` |
| `website` | Honeypot | hidden | No | Must be empty |
| `form_started_at` | Time trap | hidden | No | Submission faster than 3 seconds is rejected |

**Salary input behavior**

- Displayed with `Rp` prefix and thousand separators.
- Stored as an integer in Google Sheets.
- `last_salary` is mandatory, but fresh graduates may enter `0`.
- `expected_salary` is mandatory and must be greater than `0`.

**Validation behavior**

- Client-side validation with Zod and React Hook Form.
- The same Zod schema is validated again on the server.
- Field-level error messages in Indonesian.
- Preserve submitted values when returning validation errors.
- Disable double submission while processing.

**Duplicate policy**

- One active application per WhatsApp number per vacancy.
- If a duplicate is detected, show a message and direct the candidate to the tracking page.
- Submission retries use a `submission_key` and return the existing application instead of creating a duplicate.
- Email is not used for duplicate detection.

**Anti-spam**

- Honeypot field.
- Minimum 3-second fill time.
- Rate limit by IP: maximum 3 application submissions per hour, using the external rate-limit store when configured and an in-memory best-effort fallback otherwise.
- Server-side validation is authoritative.
- Add Cloudflare Turnstile later only if actual spam appears.

### 5.4 Success page

Route: `/lamaran/berhasil/[token]`

Shows:

- Confirmation message.
- Applicant ID in a large, copyable format, e.g. `Admin-BudiSantoso-7K3Q9M`.
- Vacancy title and application date.
- Direct tracking link.
- Buttons:
  - Salin Applicant ID
  - Salin link lacak
  - Kirim ke WhatsApp saya
  - Cetak / simpan bukti lamaran
- Clear warning: "Simpan Applicant ID ini. Kami tidak mengirimkannya melalui email."
- `noindex, nofollow`.
- Print stylesheet that produces a clean one-page proof of application.

The page must be readable only with the secret token. It should not expose a list of applicants.

### 5.5 Tracking page

**Manual tracking** — `/lacak`

- Input: Applicant ID + No. WhatsApp.
- Applicant ID input is case-insensitive and accepts spaces in place of hyphens.
- On success, redirect to the token-based tracking page or render the timeline.
- On failure, show a generic message: "Data lamaran tidak ditemukan. Periksa kembali Applicant ID dan nomor WhatsApp."
- Rate limit: maximum 10 lookup attempts per 10 minutes per IP.
- Never reveal whether the ID exists without a matching phone number.

**Direct tracking** — `/lacak/[token]`

- Read-only summary:
  - Candidate name (masked partially if desired).
  - Vacancy title.
  - Applied date.
  - Current stage.
  - Timeline of stage changes and status changes.
  - Next step message based on current stage.
- Do not show internal notes, admin identity, or internal rejection reasons.
- Withdrawal is available when status is `active` and stage is not `hired`, but it requires Applicant ID + WhatsApp confirmation even when opened from a token link.
- Withdraw requires confirmation.

**Timeline labels**

- Lamaran diterima
- Masuk tahap Screening
- Interview HR
- Interview User
- Penawaran
- Diterima
- Ditolak
- Mengundurkan diri
- Dipindahkan ke tahap {label} (used for backward or non-sequential moves)

Only public-safe notes are shown. Internal notes are never rendered.

### 5.6 Lost-ID recovery

Route: `/lacak/cari`

- Input: No. WhatsApp + Nama lengkap.
- Email is optional and is not required for recovery.
- Show a list of matching applications with:
  - Vacancy title
  - Application date
  - Masked Applicant ID
  - Button to reveal the full Applicant ID after a second confirmation
- After revealing the full ID, link to manual tracking. The token is never handed out by recovery.
- Rate limit aggressively and log failed attempts without storing raw phone numbers or names.
- This flow exists because there is no email notification at launch.

**Privacy tradeoff:** possession of the WhatsApp number plus the correct name is treated as sufficient proof for this low-volume internal recruitment use case. This is documented in the privacy notice.

### 5.7 Withdrawal

- Candidate can withdraw from the tracking page while status is `active` and stage is not `hired`.
- Withdrawal requires Applicant ID + WhatsApp confirmation, even when opened from a token link.
- Sets `status = withdrawn`.
- Appends a `Stage_History` event with `changed_by = candidate`.
- After withdrawal, the page shows a confirmation and disables the button.
- Admin can see withdrawn candidates but cannot reactivate them in MVP without a manual sheet edit.

---

## 6. Admin experience

### 6.1 Authentication

- Email + password only.
- One superadmin account.
- No public signup.
- Passwords hashed with bcrypt (cost 12).
- Session stored in a signed HttpOnly cookie using `jose` (HS256).
- Cookie settings: `httpOnly`, `secure` in production, `sameSite=lax`, `path=/`.
- Session lifetime: 7 days.
- `session_version` in `Admin_Users` allows invalidating old sessions after a password change.
- Login rate limit: 5 failed attempts per 15 minutes per IP + email combination.
- Generic error message: "Email atau password salah."
- Logout clears the cookie.
- Seed the first admin with a CLI script.
- Reset the password with a CLI script because there is no email service.

### 6.2 Dashboard

Cards:

- Lowongan aktif
- Total pelamar
- Pelamar bulan ini
- Pelamar baru 7 hari terakhir

Sections:

- Current-stage distribution: Lamaran Masuk, Screening, Interview HR, Interview User, Penawaran, Diterima.
- Separate counts for Ditolak and Mengundurkan Diri.
- Applicants per vacancy.
- Recent applications table with links.
- No chart library; use simple CSS bars and counts.

### 6.3 Vacancy management

**List**

- Columns: title, department, location, type, status, applicants, closing date, actions.
- Filters: status, department.
- Actions: edit, open, close, archive.

**Create / edit form**

- Title
- Slug, auto-generated from title, editable, unique
- Position code, auto-generated from title, editable, alphanumeric, used as the first segment of the Applicant ID
- Department
- Location
- Employment type: Penuh Waktu, Kontrak, Magang, Paruh Waktu
- Description, plain text
- Requirements, plain text
- Quota, informational only
- Open date, optional
- Close date, optional
- Status: draft, open, closed, archived

**Rules**

- Slug must be unique.
- Position code is required, maximum 24 alphanumeric characters. Changing it affects only future Applicant IDs; existing IDs remain unchanged.
- Only `open` vacancies appear publicly.
- A vacancy past its close date is treated as closed publicly but remains visible in admin.
- Quota is informational in MVP. The admin closes the vacancy manually when filled.
- Do not hard-delete vacancies that have applications. Use `archived`.
- Vacancy IDs use `VAC-0001` format and are never reused.

### 6.4 Applicant list

- Columns: name, vacancy, current stage, status, applied date, WhatsApp, actions.
- Search by name, WhatsApp, or Applicant ID.
- Filters:
  - Vacancy
  - Stage
  - Status
  - Applied date range
- Sort by newest first by default.
- Pagination or virtualized table; at 50/month, client-side pagination is sufficient.
- Export the current filtered result to CSV.
- Show a "new" badge for applications created in the last 7 days.

### 6.5 Applicant detail

Sections:

- Header: name, vacancy, stage badge, status badge, applied date.
- Contact: WhatsApp click-to-chat, email if provided, city.
- Profile: education, major, experience, last company, last salary, expected salary, availability, source.
- Links: CV/portfolio and LinkedIn, opened in a new tab with `rel="noopener noreferrer"`.
- Motivation text.
- Stage timeline with dates and admin notes that are explicitly marked public-safe.
- Internal notes list and add-note form.
- Actions:
  - Move to any stage, forward or backward.
  - Reject with an internal reason.
  - Reopen a rejected application.
  - Copy WhatsApp message.
- No destructive delete action in the UI. Use status changes.

**Stage update rules**

- Moving to a new stage requires a confirmation.
- A stage change writes a `Stage_History` row.
- Active applications may move forward or backward, including skipping stages.
- `hired` is a stage; status remains `active`. It can be moved backward with an explicit warning.
- Rejection sets `status = rejected` and keeps `current_stage` unchanged.
- Direct rejection from `hired` is blocked; move the candidate back first.
- Reopening sets `status = active` and appends a history event.
- Withdrawn applications cannot be moved by admin in MVP.

### 6.6 Internal notes

- Notes are visible only in admin.
- Fields: application ID, author email, body, created timestamp.
- Maximum 2,000 characters.
- Notes are append-only. No editing or deleting in MVP.
- Never displayed on the public tracking page.

### 6.7 WhatsApp message templates

Because there is no automation, the admin can copy a pre-filled message:

```text
Halo {nama}, terima kasih telah melamar posisi {posisi} di Erdes Group.

Status lamaran Anda saat ini: {tahap}.
{pesan_tambahan}

Anda dapat memantau lamaran melalui:
{link_lacak}

Applicant ID: {applicant_id}
```

- Templates are stored in `Settings`.
- The admin can edit templates in `/admin/pengaturan`.
- Copy button uses the clipboard API.
- No message is sent automatically.

### 6.8 CSV export

- Export the currently filtered applicant list.
- Include all application fields, vacancy title, current stage, status, and timestamps.
- Exclude internal notes by default.
- UTF-8 with BOM so Excel opens Indonesian characters correctly.
- Filename: `pelamar-{vacancy-slug or all}-{YYYY-MM-DD}.csv`.
- Escape commas, quotes, and newlines correctly.
- Protect against CSV formula injection by prefixing dangerous leading characters (`=`, `+`, `-`, `@`, tab, carriage return) with `'`.
- CSV generation happens on the server and requires an authenticated session.

### 6.9 Settings

- Company profile: name, address, contact email, contact WhatsApp.
- WhatsApp templates.
- Change password.
- Retention cleanup:
  - Shows the number of applications eligible for anonymization.
  - Requires typing a confirmation phrase.
  - Anonymizes applications with status `rejected` or `withdrawn` whose `closed_at` is older than 12 months.
  - Adds `anonymized_at` to the application.
  - Because the Applicant ID contains the name, replaces it with a unique `ANON-{6-char}` ID and updates related `Stage_History` rows.
  - Clears the tracking token and removes internal notes.
  - Retains aggregate fields for statistics: vacancy, applied date, closed date, stage, status, education, experience, availability, source, consent timestamp, and privacy version.
  - Removes name, WhatsApp, email, city, major, last company, salaries, CV URL, LinkedIn, motivation, and notes.
  - Documents that Google Sheets version history and backups may retain residual PII.
  - Logs the action timestamp and affected count in `Settings`.

### 6.10 Password recovery

CLI scripts:

- `npm run admin:create` — create the first superadmin.
- `npm run admin:set-password` — set a new password for an existing admin.
- Both scripts read from environment variables or interactive prompts.
- Scripts connect to the same Google Sheet through the service account.
- No password reset link and no email involved.

---

## 7. Recruitment stages

Stages are fixed in code for MVP. Labels are stored in a shared constants file.

| Slug | Label | Meaning |
|---|---|---|
| `applied` | Lamaran Masuk | Application received |
| `screening` | Screening | Initial document/qualification review |
| `hr_interview` | Interview HR | HR interview |
| `user_interview` | Interview User | User/technical interview |
| `offering` | Penawaran | Offer stage |
| `hired` | Diterima | Candidate accepted |

Application statuses:

| Status | Meaning |
|---|---|
| `active` | Still in the process |
| `rejected` | Rejected at any stage |
| `withdrawn` | Withdrawn by the candidate |

Rules:

- A stage change appends a history event.
- Active applications may move forward or backward, including skipping stages.
- A rejection can happen from any active stage except `hired`; move a hired candidate back first.
- `hired` is a positive stage and can be moved backward with confirmation.
- Rejected and withdrawn applications are excluded from active funnel counts but remain visible in filters.

---

## 8. Applicant ID and tracking

### 8.1 Applicant ID format

```text
{PositionCode}-{FullNameCompact}-{UniqueCode}
```

Examples:

```text
Admin-BudiSantoso-7K3Q9M
GuruMatematika-SitiAminah-2N8P4R
```

**PositionCode**

- Derived from the vacancy title when the vacancy is created.
- Stored separately in `Vacancies.position_code`, so changing the vacancy title later does not change existing IDs.
- Editable by the superadmin; changes affect only applications submitted afterward.
- Maximum 24 characters, ASCII alphanumeric only; normalize diacritics, remove spaces and punctuation, e.g. `Staff Admin` becomes `StaffAdmin`.
- If nothing remains after sanitization, use `Posisi`.
- If the code is changed after applications exist, old IDs keep the old code and new applications use the new code.

**FullNameCompact**

- Derived from the candidate's full name at submission.
- Normalize diacritics, remove spaces and punctuation, and keep ASCII letters and numbers only.
- Preserve capitalization and concatenate name parts: `Budi Santoso` becomes `BudiSantoso`.
- Maximum 32 characters; longer names are truncated.
- If nothing remains after sanitization, including non-Latin scripts, use `Kandidat`.
- The ID is immutable during the application lifecycle, except when the application is anonymized (see Section 11.4). If the candidate's name is corrected later, the ID is not regenerated.

**UniqueCode**

- 6 characters from a confusion-safe alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `I`, `O`, `0`, `1`).
- Generated with a cryptographically secure random generator.
- Checked against all existing application IDs; regenerate on collision, up to 10 attempts.
- Uppercase, e.g. `7K3Q9M`.

**Lookup rules**

- Case-insensitive.
- Trim surrounding whitespace.
- Remove all whitespace and hyphens before comparison, so `Admin BudiSantoso 7K3Q9M` matches `Admin-BudiSantoso-7K3Q9M`.
- Store the canonical ID exactly as generated; normalization is only for matching.
- The UI may add visual spacing around hyphens for readability, but the copy button always copies the canonical no-space form.

**Privacy note**

- The ID contains the candidate's name and position. It is not secret by itself.
- Tracking still requires the matching WhatsApp number, except when using the secret token link.
- Applicant IDs are never displayed in public lists.

### 8.2 Secret token

- Generated with `crypto.randomBytes(16).toString("base64url")`.
- Stored in `Applications.token`.
- Used in `/lamaran/berhasil/[token]` and `/lacak/[token]`.
- Never shown in lists or logs.
- Can be regenerated by the admin only if a link is compromised. This is out of MVP scope; manual sheet edit is acceptable initially.

### 8.3 Tracking security

- Applicant IDs contain the candidate name and position, and the unique suffix is randomly generated. They are not secret.
- Access requires the matching WhatsApp number.
- Lookup attempts are rate-limited and return generic errors.
- Direct token links are unguessable but treated as bearer secrets; they are read-only for tracking.
- Withdrawal requires Applicant ID + WhatsApp confirmation, even from a token link.
- Token pages use `Referrer-Policy: no-referrer`; access-log exposure is documented.
- Public pages never expose a list of applicants.
- Tracking pages are marked `noindex`.

---

## 9. Data model — Google Sheets

### 9.1 Spreadsheet tabs

| Tab | Purpose |
|---|---|
| `Vacancies` | Job openings |
| `Applications` | Candidate applications |
| `Stage_History` | Append-only stage and status timeline |
| `Notes` | Internal admin notes |
| `Admin_Users` | Superadmin account |
| `Settings` | Counters, company profile, templates, retention metadata |

Future optional tab: `Activity_Log`.

### 9.2 Vacancies

| Column | Type | Notes |
|---|---|---|
| `id` | string | `VAC-0001`, unique |
| `slug` | string | Unique, URL-safe |
| `title` | string | Required |
| `position_code` | string | Required, alphanumeric, max 24; first segment of Applicant ID |
| `department` | string | Required |
| `location` | string | Required |
| `employment_type` | string | `full_time`, `contract`, `internship`, `part_time` |
| `description` | string | Plain text |
| `requirements` | string | Plain text |
| `quota` | integer | Informational |
| `open_at` | ISO string or empty | UTC |
| `close_at` | ISO string or empty | UTC |
| `status` | string | `draft`, `open`, `closed`, `archived` |
| `created_at` | ISO string | UTC |
| `updated_at` | ISO string | UTC |

### 9.3 Applications

| Column | Type | Notes |
|---|---|---|
| `id` | string | `Admin-BudiSantoso-7K3Q9M`, unique |
| `token` | string | Secret tracking token |
| `submission_key` | string | Idempotency key for retry-safe submissions |
| `vacancy_id` | string | References `Vacancies.id` |
| `full_name` | string | Required |
| `whatsapp` | string | Normalized `62...` |
| `email` | string or empty | Optional |
| `city` | string | Required |
| `last_education` | string | Enum |
| `major` | string or empty | Optional |
| `experience_years` | integer | 0–60 |
| `last_company` | string or empty | Optional |
| `last_salary` | integer | IDR, 0 allowed |
| `expected_salary` | integer | IDR, greater than 0 |
| `cv_url` | string or empty | HTTPS only |
| `linkedin_url` | string or empty | HTTPS only |
| `motivation` | string | Required |
| `availability` | string | Enum |
| `source` | string | Enum |
| `source_other` | string or empty | Details when `source` is "Lainnya" |
| `consent` | boolean | `TRUE` |
| `consent_at` | ISO string | UTC |
| `privacy_version` | string | Privacy notice version accepted |
| `current_stage` | string | Stage slug |
| `status` | string | `active`, `rejected`, `withdrawn` |
| `applied_at` | ISO string | UTC |
| `closed_at` | ISO string or empty | Set when rejected or withdrawn |
| `anonymized_at` | ISO string or empty | Set by retention cleanup |
| `updated_at` | ISO string | UTC |

### 9.4 Stage_History

| Column | Type | Notes |
|---|---|---|
| `id` | string | `HIST-000001` |
| `application_id` | string | References `Applications.id` |
| `from_stage` | string or empty | Empty for initial event |
| `to_stage` | string | Stage slug |
| `from_status` | string or empty | Empty for initial event |
| `to_status` | string | `active`, `rejected`, `withdrawn` |
| `note` | string or empty | Public-safe summary only |
| `changed_by` | string | Admin email, `system`, or `candidate` |
| `changed_at` | ISO string | UTC |
| `note_is_public` | boolean or empty | Only `TRUE` permits the note to appear on the public timeline; absent or empty values remain private |

### 9.5 Notes

| Column | Type | Notes |
|---|---|---|
| `id` | string | `NOTE-000001` |
| `application_id` | string | References `Applications.id` |
| `author_email` | string | Admin email |
| `body` | string | Internal only |
| `created_at` | ISO string | UTC |

### 9.6 Admin_Users

| Column | Type | Notes |
|---|---|---|
| `id` | string | `ADM-0001` |
| `email` | string | Unique |
| `name` | string | Display name |
| `password_hash` | string | bcrypt hash |
| `role` | string | `superadmin` |
| `active` | boolean | `TRUE` |
| `session_version` | integer | Increment to invalidate sessions |
| `created_at` | ISO string | UTC |
| `last_login_at` | ISO string or empty | UTC |

### 9.7 Settings

| Key | Type | Purpose |
|---|---|---|
| `schema_version` | string | Sheet schema version |
| `privacy_version` | string | Current privacy notice version |
| `vacancy_counter` | integer | Vacancy ID counter |
| `history_counter` | integer | Stage history ID counter |
| `note_counter` | integer | Note ID counter |
| `company_profile` | JSON string | Name, address, contact |
| `wa_templates` | JSON string | Stage message templates |
| `retention_months` | integer | Default 12 |
| `last_purge_at` | ISO string or empty | Last retention cleanup |

### 9.8 Sheet conventions

- Row 1 contains headers. Data starts at row 2.
- All writes use Google Sheets API `valueInputOption: RAW` to avoid formula injection.
- Never evaluate user input as a formula.
- Dates are stored as ISO 8601 UTC strings and displayed in Asia/Jakarta.
- Salaries are stored as integers, not formatted strings.
- WhatsApp numbers are stored as strings without `+`, e.g. `6281234567890`.
- Booleans are stored as `TRUE`/`FALSE`.
- No formulas, pivot tables, or business logic in the Sheet.
- Freeze row 1 and protect headers.
- The spreadsheet is private and shared only with the service account.
- Tab names are ASCII and case-sensitive.

### 9.9 ID generation and consistency

**Applicant IDs**

- Generated at submission from `Vacancies.position_code`, the sanitized full name, and a random 6-character suffix.
- The suffix is generated with `crypto.randomBytes` mapped to the confusion-safe alphabet.
- Read existing application IDs and retry up to 10 times if the candidate ID already exists.
- No sequential counter is needed for Applicant IDs.
- The ID is immutable during the active lifecycle and is never reused.
- On anonymization, replace it with a non-identifying `ANON-{6-char}` ID and update related history rows.
- If the position code or candidate name contains unsupported characters, sanitize them as described in Section 8.1.

**Other entity IDs**

- Vacancy, stage history, and note IDs use their own counters in `Settings`.
- Counter sequence: read counter, increment, update counter, append row.
- Because Sheets has no atomic increment, a collision check is required.
- At 50 applications/month, simultaneous submissions are extremely unlikely.
- If a write fails, retry with exponential backoff for 429 and 5xx responses.
- Application submission uses `submission_key` to make retries idempotent.
- Stage changes append `Stage_History` first, then update `Applications`. A lightweight reconciliation check can replay the latest history entry if the application update fails.
- No transaction guarantee. The admin UI should surface a friendly error if a partial write occurs.

### 9.10 Repository layer

The repository interface lives in `lib/repositories/types.ts`. The Google Sheets implementation lives in `lib/repositories/sheets.ts` and uses `lib/sheets/` for raw API access. All are marked `server-only`.

Suggested functions:

- `getOpenVacancies()`
- `getVacancyBySlug(slug)`
- `getVacancyById(id)`
- `createVacancy(input)`
- `updateVacancy(id, input)`
- `appendApplication(input)`
- `findApplicationBySubmissionKey(key)`
- `getApplicationById(id)`
- `getApplicationByToken(token)`
- `findActiveApplicationByPhoneAndVacancy(phone, vacancyId)`
- `getApplicationsForRecovery(phone, fullName)`
- `getApplications(filters)`
- `updateApplicationStage(id, stage, status, note, actor)`
- `appendStageHistory(event)`
- `getStageHistory(applicationId)`
- `reconcileApplicationStage(id)`
- `addNote(applicationId, author, body)`
- `getNotes(applicationId)`
- `getDashboardStats()`
- `getSettings()`
- `updateSettings(settings)`
- `getAdminByEmail(email)`
- `createAdmin(input)`
- `updateAdminPassword(email, hash)`
- `anonymizeExpiredApplications(months)`

The rest of the app must not call Google APIs directly.

---

## 10. Architecture

### 10.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router + TypeScript |
| Styling | Tailwind CSS + small internal UI primitives |
| Forms | React Hook Form + Zod |
| Sheets | `googleapis` with a service account |
| Auth | `jose` JWT cookie + `bcryptjs` |
| Dates | `date-fns` with `id` locale plus `date-fns-tz` or `Intl.DateTimeFormat` for Asia/Jakarta |
| Icons | `lucide-react` |
| Tests | Vitest for unit/integration, Playwright optional |
| Hosting | Vercel |
| Node | Node.js LTS (20 or 22) |

### 10.2 Suggested folder structure

```text
app/
  (public)/
    page.tsx
    lowongan/[slug]/page.tsx
    lowongan/[slug]/lamar/page.tsx
    lamaran/berhasil/[token]/page.tsx
    lacak/page.tsx
    lacak/[token]/page.tsx
    lacak/cari/page.tsx
    privasi/page.tsx
  admin/
    login/page.tsx
    (protected)/
      layout.tsx
      page.tsx
      lowongan/page.tsx
      lowongan/baru/page.tsx
      lowongan/[id]/page.tsx
      pelamar/page.tsx
      pelamar/[id]/page.tsx
      pelamar/export/route.ts
      pengaturan/page.tsx
  layout.tsx
  globals.css
components/
  ui/
  public/
  admin/
lib/
  repositories/
    types.ts
    memory.ts
    sheets.ts
  sheets/
    client.ts
    schema.ts
    mappers.ts
  auth/
    session.ts
    password.ts
    guards.ts
  validation/
    application.ts
    vacancy.ts
    tracking.ts
  format/
    currency.ts
    date.ts
    phone.ts
  constants.ts
scripts/
  bootstrap-sheet.ts
  admin-create.ts
  admin-set-password.ts
  purge-retention.ts
middleware.ts
tests/
```

### 10.3 Caching

- Cache open vacancy lists and vacancy details for 60 seconds.
- Use tag-based revalidation: `vacancies`.
- Call `revalidateTag("vacancies")` after any vacancy create/update/close.
- Do not cache application data, tracking data, or admin lists.
- Dashboard reads fresh data on every load; volume is low.

### 10.4 Server actions and route handlers

- Application submission: server action.
- Tracking lookup: server action.
- Lost-ID recovery: server action.
- Withdrawal: server action.
- Admin login/logout: server actions.
- Vacancy CRUD: server actions.
- Stage updates and notes: server actions.
- CSV export: route handler.
- No public REST API required for MVP.

### 10.5 Auth architecture

- `middleware.ts` checks the session cookie for all `/admin` routes except `/admin/login`. Confirm the current Next.js file convention (`middleware.ts` or `proxy.ts`) and async `cookies()`/`searchParams` APIs when pinning the framework version.
- The admin layout verifies the session again and checks `session_version`.
- Server actions also call `requireAdmin()`.
- Never rely on middleware alone for authorization.
- The service account key and Sheet ID are server-only environment variables.

---

## 11. Security and privacy

### 11.1 Input security

- Validate every input with Zod on the server.
- Normalize WhatsApp numbers before storage.
- Allow only `https://` URLs for CV and LinkedIn.
- Store user text with RAW writes to prevent formula injection.
- Escape CSV fields correctly and protect against CSV formula injection.
- Do not render raw HTML from user input.
- Limit text lengths.

### 11.2 Rate limits and abuse prevention

- Application submission: 3 per hour per IP.
- Tracking lookup: 10 per 10 minutes per IP.
- Lost-ID recovery: 5 per 15 minutes per IP and WhatsApp number.
- Login: 5 failed attempts per 15 minutes.
- Honeypot and time trap on the application form.
- Duplicate application check by WhatsApp + vacancy.
- Use an external rate-limit store (Upstash Redis/Vercel KV) when configured.
- In-memory rate limiting is a documented best-effort fallback only and resets on cold starts.

### 11.3 Data protection

- The Google Sheet is private.
- Share it only with the service account email.
- Do not expose the service account JSON in the client bundle.
- Store secrets in Vercel environment variables.
- Rotate the service account key if it leaks.
- Restrict admin access to one account.
- Do not show candidate personal data on public pages except to the verified tracking session.
- Add `noindex` to success and tracking pages.

### 11.4 Privacy and retention

- Consent checkbox is mandatory.
- `/privasi` explains:
  - What data is collected.
  - Why it is collected.
  - Who can access it.
  - How long it is retained.
  - How to request deletion.
- Applicant IDs contain the candidate's name and position. This is disclosed on `/privasi`; an ID is never treated as a secret.
- Rejected and withdrawn applications are anonymized 12 months after `closed_at`.
- Anonymization keeps aggregate fields: vacancy, dates, stage, status, education, experience, availability, source, consent timestamp, privacy version, and a non-identifying `ANON-{6-char}` ID.
- Anonymization replaces the original Applicant ID, updates `Stage_History`, clears the tracking token, and removes internal notes.
- Anonymization removes: name, WhatsApp, email, city, major, last company, salaries, CV URL, LinkedIn, and motivation.
- Hired candidates are retained as employment records; manual review is required.
- Weekly backup of the spreadsheet is recommended.
- Google Sheets version history and backups may retain residual PII after live anonymization; this is documented in the privacy notice and backup policy.

### 11.5 HTTP security headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricted to necessary features.
- Consider a Content Security Policy after the UI stabilizes.

---

## 12. UI and UX

### 12.1 Design direction

- Neutral, professional palette: stone/zinc background, dark text, one restrained accent color.
- Accent color is a placeholder and must be a CSS variable.
- No custom illustration dependency.
- Clean typography, generous spacing, clear hierarchy.
- Mobile-first because most candidates will apply from a phone.

### 12.2 Design tokens

Define in `app/globals.css`:

- `--background`
- `--foreground`
- `--muted`
- `--muted-foreground`
- `--border`
- `--accent`
- `--accent-foreground`
- `--danger`
- `--success`
- Radius and spacing tokens

All components use these tokens. This keeps the future UI redesign contained.

### 12.3 Component strategy

- Small internal primitives: Button, Input, Select, Textarea, Card, Badge, Dialog, Toast, Table.
- Keep public and admin components separate.
- Avoid coupling page logic to visual components.
- UI copy centralized in Indonesian constants where practical.

### 12.4 Responsive behavior

- Application form: single column, large tap targets, sticky submit button on mobile.
- Applicant table: horizontally scrollable on small screens, or card layout.
- Admin sidebar collapses into a mobile menu.
- Test at 360 px, 768 px, and 1280 px widths.

### 12.5 Accessibility

- Every input has a visible label.
- Error messages are linked to fields with `aria-describedby`.
- Focus states are visible.
- Color contrast meets WCAG AA.
- Dialogs trap focus and close with Escape.
- Buttons have descriptive text, not icon-only unless labeled.

### 12.6 Copy and formatting

- All UI copy in Bahasa Indonesia.
- Dates formatted with `id-ID`, e.g. `2 November 2026`.
- Times in Asia/Jakarta.
- Currency formatted as `Rp8.500.000`.
- Use formal but friendly language.

### 12.7 Print view

- Success page has a print stylesheet.
- Print includes: Erdes Group name, Applicant ID, candidate name, vacancy, application date, and tracking instructions.
- Hide navigation, buttons, and decorative elements when printing.

---

## 13. Google Sheets setup

### 13.1 Create the spreadsheet

1. Create a Google Sheet named `Erdes Recruitment DB`.
2. Keep it private.
3. Do not publish it to the web.

### 13.2 Create tabs

Run the bootstrap script to create missing tabs and headers:

```bash
npm run sheet:bootstrap
```

The script should:

- Verify the spreadsheet ID.
- Create missing tabs.
- Write header rows.
- Freeze row 1.
- Protect header rows where possible.
- Validate existing headers and fail loudly on mismatch.

### 13.3 Google Cloud setup

1. Create a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a service account.
4. Create a JSON key for the service account.
5. Copy the service account email.
6. Share the spreadsheet with that email as **Editor**.
7. Store the credentials in environment variables, not in the repository.

### 13.4 Environment variables

| Variable | Purpose |
|---|---|
| `GOOGLE_SHEETS_ID` | Spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Private key with escaped newlines |
| `AUTH_SECRET` | Secret for signing session JWTs |
| `NEXT_PUBLIC_APP_URL` | Base URL, e.g. `https://erdes-recruitment.vercel.app` |
| `ADMIN_EMAIL` | Seed only, not required at runtime |
| `ADMIN_PASSWORD` | Seed only, not required at runtime |
| `UPSTASH_REDIS_REST_URL` | Optional external rate-limit store URL |
| `UPSTASH_REDIS_REST_TOKEN` | Optional external rate-limit store token |

Use `.env.local` for local development and Vercel environment variables for production. Add `.env*` to `.gitignore`.

### 13.5 Bootstrap order

> This setup order is executed by the project owner after all implementation batches are approved (Section 16.4).

1. Create Sheet and tabs.
2. Configure Google Cloud and service account.
3. Set environment variables.
4. Run `npm run sheet:bootstrap`.
5. Run `npm run admin:create`.
6. Start the app and verify login.

---

## 14. Deployment

### 14.1 Local setup

> Node.js and dependencies are installed in Batch 1. Steps 3–5 are performed after all implementation batches; Batches 1–6 run against the in-memory repository.

1. Install Node.js LTS.
2. Install dependencies.
3. Create `.env.local`.
4. Run the Sheet bootstrap.
5. Create the superadmin.
6. Run the development server.

### 14.2 Vercel deployment

> Deployment is performed after all implementation batches and the local live-Sheet verification.

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add all environment variables.
4. Deploy.
5. Use the generated `*.vercel.app` domain.
6. Run a post-deploy smoke test.

### 14.3 Vercel plan note

Vercel Hobby is intended for personal, non-commercial use. This is an internal office tool. Prototype on Hobby is fine, but before official company use, confirm Vercel's terms or move to Pro. A commercial-friendly free alternative is Cloudflare Pages/Workers, at the cost of additional Next.js deployment complexity.

### 14.4 Backups

- Make a manual copy of the spreadsheet weekly.
- Make a copy before any schema change or bulk cleanup.
- Export applicant CSV monthly if required by office policy.
- Keep backup access restricted because it contains personal data.

---

## 15. Testing strategy

### 15.1 Unit tests

- Zod schemas for application, vacancy, and tracking.
- WhatsApp normalization.
- Salary parsing and formatting.
- Applicant ID ASCII sanitization, non-Latin fallback, format, case-insensitive normalization, and collision retry.
- Stage transition guards, including backward and skipped moves.
- CSV escaping and formula-injection protection.
- Date and currency formatting in Asia/Jakarta.
- Consent timestamp and privacy version mapping.

### 15.2 Integration tests

- Repository mapping between Sheet rows and domain objects.
- Application submission with an in-memory repository.
- Idempotent submission using `submission_key`.
- Duplicate application detection by WhatsApp + vacancy.
- Tracking lookup success and failure.
- Lost-ID recovery reveals the ID but not the token.
- Withdrawal requires Applicant ID + WhatsApp.
- Admin login and session verification.
- Stage update writes both application and history, including backward moves.
- Anonymization replaces the Applicant ID, updates history references, removes notes, and clears the token.
- Consent timestamp and privacy version are persisted.

### 15.3 Manual end-to-end checklist

- Open the landing page on mobile and desktop.
- Apply to an open vacancy.
- Confirm the success page shows a valid Applicant ID.
- Copy the ID and tracking link.
- Track using ID + WhatsApp.
- Track using a lowercase ID and spaces instead of hyphens.
- Try tracking with the wrong phone number and confirm a generic error.
- Recover a lost ID with WhatsApp + full name and confirm only the full ID is revealed, not the token.
- Confirm a token tracking link is read-only and withdrawal requires Applicant ID + WhatsApp.
- Withdraw an application.
- Log in as admin.
- Create, edit, close, and archive a vacancy.
- View the new applicant.
- Move the applicant through stages forward and backward, including skipping stages.
- Confirm `hired` can be moved backward only with a confirmation warning.
- Reject and reopen the applicant.
- Add an internal note and confirm it does not appear publicly.
- Copy a WhatsApp template.
- Export CSV with a formula-like value and confirm it is not executed by Excel.
- Change the admin password and confirm old sessions are invalidated.
- Run retention cleanup in a test Sheet and confirm the original Applicant ID is gone.
- Print the success page.
- Verify no secrets appear in the browser bundle.

### 15.4 Acceptance criteria

The MVP is accepted when:

- A candidate can apply without an account or email.
- A unique Applicant ID in `Position-FullName-UniqueID` format and a secret tracking link are generated.
- Tracking works with Applicant ID + WhatsApp.
- Lost-ID recovery works with WhatsApp + full name.
- Withdrawal works and is reflected in admin.
- Admin can manage vacancies and applicants end to end.
- Stage changes can move forward and backward and produce an accurate timeline.
- Consent timestamp and privacy version are stored.
- Internal notes never appear publicly.
- CSV export works and is safe from formula injection.
- PII is protected and retention cleanup works.
- The app is responsive, in Indonesian, and deployed on Vercel.
- No Google credentials or Sheet contents are exposed to the client.

---

## 16. Implementation batches

### 16.1 Delivery approach

- Implementation is split into six reviewable batches.
- Each batch ends with a working build, tests, and a short review checkpoint. Work on the next batch starts only after approval.
- Batches 1–6 are built against the repository interface with an in-memory adapter and seed data. Google Sheets, Vercel, and `.env.local` are not required during implementation.
- The Google Sheets adapter, mappers, bootstrap script, and admin CLI scripts are written and unit-tested during the batches, but live Sheet verification happens after the owner completes the setup.
- After all six batches, the owner sets up the Google Sheet, service account, Vercel project, and environment variables. A final post-batch integration and launch checklist is then executed (Section 16.4).

### 16.2 Batch overview

| Batch | Scope | Review gate |
|---|---|---|
| **1. Foundation** | Tooling, Next.js scaffold, design tokens, UI primitives, constants, validation, repository interface + in-memory adapter + Sheets adapter skeleton, env validation, test setup | Dev server runs; unit tests pass; no credentials needed |
| **2. Public careers** | Landing page, vacancy detail, application form, success page, print view, submission action, duplicate/anti-spam checks | A candidate can apply with seed data and receive an ID + token |
| **3. Tracking** | Manual tracking, token tracking, public timeline, lost-ID recovery, withdrawal | Candidate can track, recover, and withdraw end to end |
| **4. Admin core** | Login/logout/session, admin shell, dashboard, vacancy CRUD, applicant list/detail | Admin can log in, manage vacancies, and inspect applicants |
| **5. Admin workflow** | Forward/backward stage moves, history, reject/reopen, notes, WhatsApp templates, CSV export | Full recruitment pipeline works; internal notes never appear publicly |
| **6. Hardening and handoff** | Rate limiting, retention cleanup, security headers, accessibility, full test pass, docs, `.env.example`, Sheets live-integration checklist | All offline acceptance criteria pass; project is ready for owner setup |

### 16.3 Batch details

**Batch 1 — Foundation**

Deliverables:

- Install Node.js 22 LTS and Git; initialize the repository and Next.js app.
- Tailwind tokens, base layout, and UI primitives: Button, Input, Select, Textarea, Card, Badge, Dialog, Toast, Table.
- Shared constants: stages, statuses, enums, Indonesian labels, next-step messages.
- Zod schemas for application, vacancy, and tracking.
- Formatting utilities: WhatsApp normalization, currency, date/time in Asia/Jakarta.
- Repository interface, in-memory adapter, Google Sheets adapter skeleton, row mappers.
- Environment validation, `.env.example`, Vitest setup.
- `DECISIONS.md` recording the approved decisions in Section 20.

Done when:

- `npm run dev` starts the app.
- `npm test` passes.
- No Google credentials are required.
- The batch is reviewed and approved.

**Batch 2 — Public careers**

Deliverables:

- Landing page with search and filters.
- Vacancy detail page with open/closed states.
- Universal application form with client and server validation, salary formatting, consent, honeypot, time trap.
- Application submission server action with duplicate check and idempotency key.
- Success page with Applicant ID, token link, copy, WhatsApp share, and print view.
- `noindex` on success and tracking pages.

Done when:

- A test candidate can apply to a seeded vacancy.
- A unique Applicant ID and secret token are generated.
- Validation errors preserve values and show Indonesian messages.
- The success page prints cleanly.
- The batch is reviewed and approved.

**Batch 3 — Tracking**

Deliverables:

- Manual tracking with Applicant ID + WhatsApp.
- Token-based tracking page with public timeline.
- Lost-ID recovery with masked results and a second confirmation that reveals only the full Applicant ID.
- Withdrawal flow with confirmation and `changed_by = candidate` history.
- Rate-limit hooks for tracking and recovery.
- Public-safe timeline labels and next-step messages.

Done when:

- Tracking works with lowercase IDs and spaces instead of hyphens.
- Wrong phone numbers return the generic error.
- Lost-ID recovery works without exposing the token.
- Withdrawal is reflected in the admin data.
- Internal notes are never rendered.
- The batch is reviewed and approved.

**Batch 4 — Admin core**

Deliverables:

- Login, logout, signed HttpOnly session cookie, `session_version` checks.
- Admin shell with responsive sidebar.
- Dashboard cards, current-stage distribution, rejected/withdrawn counts, applicants per vacancy, recent applications.
- Vacancy CRUD: create, edit, publish, close, archive; slug and position code handling.
- Applicant list with search, filters, pagination, and new badge.
- Applicant detail with contact, profile, links, motivation, timeline, and notes sections.

Done when:

- Admin can log in and out.
- Admin can create, edit, open, close, and archive vacancies.
- Admin can find and inspect applicants.
- Auth guards run in middleware, layout, and server actions.
- The batch is reviewed and approved.

**Batch 5 — Admin workflow**

Deliverables:

- Stage updates in both directions, including skipping stages.
- `hired` can be moved backward with a confirmation warning.
- Direct rejection from `hired` is blocked; move back first.
- Reject/reopen with internal reason stored in `Notes`.
- Append-only internal notes.
- Optional public-safe note on stage changes.
- WhatsApp message templates with copy-to-clipboard.
- CSV export with filters, UTF-8 BOM, and formula-injection protection.
- Dashboard and timeline reconciliation checks.

Done when:

- Admin can process a candidate end to end.
- Backward stage moves append history correctly.
- Reject/reopen works.
- Notes never appear publicly.
- CSV opens correctly in Excel.
- The batch is reviewed and approved.

**Batch 6 — Hardening and handoff**

Deliverables:

- External rate limiting (Upstash Redis/Vercel KV) or documented best-effort fallback.
- Retention cleanup with `closed_at`, `anonymized_at`, `ANON-{6-char}` IDs, history updates, and note removal.
- Security headers, HSTS, `noindex`, `robots.txt`.
- Accessibility pass: labels, `aria-describedby`, error summary, `aria-live`, focus states, dialog focus trap.
- Full unit/integration test pass.
- README, `.env.example`, setup checklist, backup/retention documentation.
- Google Sheets adapter verification checklist ready for the owner.

Done when:

- All offline acceptance criteria pass.
- The app runs end to end with the in-memory adapter.
- The owner can follow the setup checklist without code changes.
- The batch is reviewed and approved.

### 16.4 Post-batch owner setup and launch

After all six batches are approved, the project owner will:

1. Create the Google Sheet and tabs.
2. Create the Google Cloud project, enable the Sheets API, and create a service account.
3. Share the Sheet with the service account as Editor.
4. Create `.env.local` with the Sheet ID, service account credentials, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`.
5. Run `npm run sheet:bootstrap`.
6. Run `npm run admin:create`.
7. Start the app and verify login.
8. Create the Vercel project, add environment variables, and deploy.
9. Run the post-deploy smoke test and the manual end-to-end checklist in Section 15.3.

Live Sheet verification is the final integration gate. If a schema or mapper mismatch is found, it is fixed before launch.

---

## 17. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Google Sheets latency or quota errors | Slow pages or failed submissions | Batch reads, cache vacancies, retry with backoff, low expected volume |
| Concurrent submissions collide on Applicant ID | Duplicate ID | Collision check and retry; volume is very low |
| Candidate loses Applicant ID | Cannot track | Success page copy/print/WhatsApp share, direct link, WhatsApp + name recovery |
| Applicant ID exposes candidate name and position | PII exposure if shared | Require WhatsApp number, use a random suffix, rate-limit lookups, generic errors, noindex |
| Long or non-Latin names produce awkward IDs | Poor usability | Sanitize and truncate name segment; fall back to `Kandidat`; keep ID stable during the active lifecycle |
| Single admin loses password | No admin access | CLI password reset, backup of admin row, secure password storage |
| Service account key leaks | Full Sheet access | Server-only env vars, never commit, rotate key, private Sheet |
| Formula injection through form fields | Sheet compromise | RAW writes, no formula evaluation, input validation |
| CSV formula injection on export | Spreadsheet compromise | Prefix dangerous leading characters and test in Excel |
| Partial writes between Applications and Stage_History | Inconsistent timeline | Idempotency key, history-first writes, reconciliation |
| In-memory rate limits bypassed by cold starts | Brute force or abuse | External rate-limit store; fallback documented |
| Token links appear in access logs and browser history | Bearer-link exposure | Treat as bearer secret, restrict logs, use `no-referrer`, keep tracking read-only, require ID + WhatsApp for withdrawal |
| Sheet version history and backups retain PII | Privacy/compliance risk | Document residual PII; create a fresh anonymized Sheet if strict deletion is required |
| Duplicate applications | Cluttered pipeline | WhatsApp + vacancy duplicate check |
| PII retained too long | Privacy/compliance risk | Consent, privacy page, 12-month anonymization |
| Accidental Sheet edits | Broken schema | Header protection, bootstrap validation, backups |
| No notifications | Slow admin response | Dashboard counts, recent applications, manual WhatsApp templates |
| Vercel Hobby commercial-use restriction | Account/legal risk | Confirm terms before launch or upgrade/migrate |
| Cold starts with Google API client | Slight delay | Low traffic, acceptable; cache public data |

---

## 18. Assumptions and decisions

> These assumptions were reviewed on 2 November 2026. The approved resolutions are recorded in Section 20.

1. Applicant ID format is `{PositionCode}-{FullNameCompact}-{UniqueCode}`, e.g. `Admin-BudiSantoso-7K3Q9M`. Position code is stored on the vacancy; the ID is stable during the active lifecycle and replaced on anonymization.
2. Candidate email is optional and is not used to log in or track.
3. Tracking uses Applicant ID + WhatsApp number.
4. Lost-ID recovery uses WhatsApp + full name. Email is optional and is not required.
5. One active application per WhatsApp number per vacancy.
6. `last_salary` is mandatory; fresh graduates may enter `0`.
7. `expected_salary` is mandatory and must be greater than `0`.
8. Salaries are stored as integer IDR, not text.
9. Quota is informational; the admin closes vacancies manually.
10. Recruitment stages are fixed for MVP.
11. Only one superadmin account exists.
12. No candidate accounts, email notifications, WhatsApp automation, or file uploads at launch.
13. Rejected and withdrawn data is anonymized 12 months after `closed_at`.
14. The app ships with a neutral design using centralized tokens.
15. The first deployment uses a `*.vercel.app` domain.
16. Vacancy IDs use `VAC-0001`; history and note IDs use their own counters.
17. All timestamps are stored in UTC and displayed in Asia/Jakarta.
18. The Google Sheet is private and only the service account has editor access.
19. The UI is entirely in Bahasa Indonesia.
20. Vercel Hobby is acceptable for prototyping, with a plan decision before official launch.

---

## 19. Definition of done

- All six implementation batches are reviewed and approved.
- All MVP pages and admin flows work on mobile and desktop.
- Data persists correctly across all six Sheet tabs after the owner completes setup.
- No secrets or raw Sheet data reach the browser.
- Applicant ID, tracking, recovery, and withdrawal are verified.
- Admin can run the full recruitment pipeline without touching the Sheet.
- Retention cleanup and backups are documented and tested.
- The app is deployed to Vercel and passes the manual end-to-end checklist.
- `README.md` explains local setup, Google Cloud setup, environment variables, scripts, and deployment.

---

## 20. Approved decisions (2 November 2026)

The following decisions were approved before implementation. They override any conflicting text earlier in this plan.

| # | Area | Approved decision |
|---|---|---|
| 1 | Token links and withdrawal | Token links remain usable for read-only tracking. Withdrawal requires Applicant ID + WhatsApp, not just the token link. Token exposure in URLs and infrastructure logs is documented; log access is restricted and token pages use `Referrer-Policy: no-referrer`. |
| 2 | Lost-ID recovery | Recovery shows a masked list first. A second confirmation reveals only the full Applicant ID, then links to manual tracking. The token is never handed out by recovery. Email matching is optional and is not required. |
| 3 | Atomicity and idempotency | Applications store a `submission_key`; retries return the existing application. Stage updates append history first and use a reconciliation check. Partial writes surface a friendly error. |
| 4 | Rate limiting | Login, submission, tracking, and recovery use an external rate-limit store (Upstash Redis or Vercel KV) where available. An in-memory fallback is documented as best-effort only. |
| 5 | Retention and anonymization | Applications store `closed_at` and `anonymized_at`. The 12-month clock starts at `closed_at`. Anonymization uses a unique `ANON-{6-char}` ID, updates `Stage_History`, removes `Notes`, clears the token, and follows an explicit retained/removed field list. Residual PII in Sheet version history and backups is documented. |
| 6 | Consent evidence | Applications store `consent_at` and `privacy_version`. The current privacy version is stored in `Settings` and shown on `/privasi`. |
| 7 | CSV export | CSV generation protects against formula injection, includes the vacancy title, excludes internal notes by default, and uses UTF-8 with BOM. |
| 8 | Timezone and dates | Dates are displayed in Asia/Jakarta using `Intl.DateTimeFormat` or `date-fns-tz`. Admin date-only inputs are interpreted as start/end of day Jakarta and stored in UTC. The close date is inclusive. Dashboard month boundaries use Asia/Jakarta. |
| 9 | Stage moves | Active applications can move forward or backward to any stage, including skipping stages. Every move appends history. `hired` can be moved backward with a confirmation warning. Direct rejection from `hired` is blocked; move back first. Withdrawn applications are locked. Rejected applications must be reopened before moving. Dashboard shows current-stage distribution. |
| 10 | Source, WhatsApp, salary, IDs | Add `source_other` for “Lainnya”. Normalize `+62`, `62`, and `08` numbers to `62...` with separators removed. Cap salaries at a sensible maximum. Applicant IDs use ASCII-only sanitization with `Kandidat` and `Posisi` fallbacks. |
| 11 | Google and Vercel setup | The project owner performs Google Cloud, Google Sheet, Vercel, and `.env.local` setup after all six implementation batches are complete. |
| 12 | Delivery model | Implementation is delivered in six reviewable batches. Work stops after each batch for approval. Batches 1–6 use the in-memory repository and seed data. |
| 13 | Tooling | Node.js 22 LTS, Git, npm, current stable Next.js, React, and Tailwind CSS. Exact versions are pinned in `package.json`. |
