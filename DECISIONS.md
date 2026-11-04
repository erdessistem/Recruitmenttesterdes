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
