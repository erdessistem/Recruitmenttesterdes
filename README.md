# Erdes Group Recruitment

Next.js recruitment application. The public interface is in Indonesian; candidates do not create accounts. Admin access is separate.

## Current status and launch gate

The offline app and a Google Sheets adapter are implemented. The adapter and setup commands have **not been verified against a live spreadsheet**. Do not use real applicant data or launch until a private test Sheet passes the checks below and the remaining multi-instance risks are addressed.

- **Connect Upstash Redis before launch.** Rate limits (application, tracking, recovery, admin login), lost-ID recovery handles and the Sheets write lock use it (`lib/security/shared-store.ts`). Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or connect Upstash through the Vercel Marketplace, which adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (both names work). Without it, everything falls back to process memory: it works on one server but is not shared between Vercel instances. If Upstash stops answering, requests fall back to memory and log an error.
- Every Sheets write (load, change, save) runs under a lock (`lib/security/write-lock.ts`), so simultaneous writes queue instead of overwriting each other. A request waits up to 8 seconds for its turn, then shows "Sistem sedang sibuk". Reads are not locked. Edits made directly in the spreadsheet bypass the lock; avoid editing rows while the app is in use.
- Company contact details in the development seed are examples; replace them before launch. The Sheets bootstrap creates initial settings, which an admin must update.
- Browser-based end-to-end, accessibility, print, and Excel verification remain necessary. Unit tests do not replace them.

## Local development

Use Node.js 22 or newer and npm:

```sh
npm ci
npm run dev
```

Without Google credentials, development uses seeded, process-local data; changes are lost on restart and may not be shared across processes. The development admin credentials are defined in `lib/repositories/seed.ts` and are never suitable for production. Production refuses to use the temporary repository when Sheets is not configured.

```sh
npm test
npm run typecheck
npm run build
```

## Private Google Sheet setup (after review)

1. Create a private Google spreadsheet and a Google Cloud project. Enable the Google Sheets API. Create a service account, generate a key where permitted by your organization, and share only the target spreadsheet with that service account as Editor. Keep the key private.
2. Copy `.env.example` to `.env.local`. Set `GOOGLE_SHEETS_ID` to the ID in the Sheet URL, `GOOGLE_SERVICE_ACCOUNT_EMAIL` to the service account email, and `GOOGLE_PRIVATE_KEY` to the JSON key's private key. Keep escaped newlines as shown in `.env.example`. Set a unique random `AUTH_SECRET` of at least 32 characters and set `NEXT_PUBLIC_APP_URL` to the actual application origin. Never commit `.env.local`, a key, or credentials.
3. **Verify the target spreadsheet ID before running the next command.** The bootstrap creates missing tabs and initializes an empty Settings tab; it rejects mismatched existing headers. It freezes the header row but does not automatically protect it. It does not delete existing tabs. Back up an existing sheet before modifying it.

   ```sh
   npm run sheet:bootstrap
   ```

   Expected tabs: `Vacancies`, `Applications`, `Stage_History`, `Notes`, `Admin_Users`, and `Settings`. `Stage_History` includes `note_is_public`; old unmarked notes must remain private. Review the headers and protect them in Sheets. Older schemas require a reviewed migration; do not force the script to overwrite existing data.
4. Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in your local environment or `.env.local`, then run `npm run admin:create`. The script refuses to create a second admin. Remove `ADMIN_PASSWORD` from the environment and file immediately afterward. To reset an existing account, set both variables temporarily and use `npm run admin:set-password`; this increments the session version.
5. Start the app and sign in. Update company profile, contact details, and message templates. Use a **separate test spreadsheet** and synthetic information for end-to-end tests. Check creation, retries, duplicate handling, tracking, recovery, withdrawal, admin stage changes, notes privacy, CSV, and cleanup. Restart the server and verify persistence. Check the actual spreadsheet rows and that formula-like text is stored as literal text.

The scripts need access to the configured spreadsheet and make changes when run. Do not point test or preview deployments at production data.

## Deployment after the launch gate

Push reviewed source to a private Git repository and import it into Vercel. Set the Sheets credentials, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` in the appropriate environment. A preview environment should use a separate Sheet and credentials. Deploy, check the logs without exposing secrets, and repeat the synthetic-data end-to-end checks over HTTPS. Verify mobile layouts, keyboard navigation, error announcements, the print view, and the CSV in Excel. Confirm the selected hosting plan permits the intended business use.

Create the first real vacancy only after the integration and operational review pass. Restrict access to infrastructure logs: token URLs are bearer links and can appear in logs or browser history even though token pages use `no-referrer` and `noindex`.

## Retention and backups

The admin settings page previews applications rejected or withdrawn for longer than the configured retention period and requires the exact phrase `ANONIMKAN` before cleanup. Cleanup clears identifying fields, tracking tokens, submission keys, history free text, and internal notes; it retains aggregate fields and updates history references. Verify cleanup on synthetic data before use.

Keep restricted backups on a regular schedule and before migrations or cleanup. Spreadsheet version history and backups may retain personal data after live rows are anonymized; define a separate retention and deletion policy for those copies. The app cannot erase data from old versions or external backups.
