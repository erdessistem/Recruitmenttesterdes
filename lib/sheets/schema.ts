/** Ordered headers for the private spreadsheet. Settings uses key/value rows. */
export const SHEET_HEADERS = {
  Vacancies: ["id", "slug", "title", "position_code", "department", "location", "employment_type", "description", "requirements", "quota", "open_at", "close_at", "status", "created_at", "updated_at"],
  Applications: ["id", "token", "submission_key", "vacancy_id", "full_name", "whatsapp", "email", "city", "last_education", "major", "experience_years", "last_company", "last_salary", "expected_salary", "cv_url", "linkedin_url", "motivation", "availability", "source", "source_other", "consent", "consent_at", "privacy_version", "current_stage", "status", "applied_at", "closed_at", "anonymized_at", "updated_at", "last_position"],
  Stage_History: ["id", "application_id", "from_stage", "to_stage", "from_status", "to_status", "note", "changed_by", "changed_at", "note_is_public"],
  Notes: ["id", "application_id", "author_email", "body", "created_at"],
  Admin_Users: ["id", "email", "name", "password_hash", "role", "active", "session_version", "created_at", "last_login_at"],
  Settings: ["key", "value"],
} as const;
export type SheetName = keyof typeof SHEET_HEADERS;

/**
 * Columns added after launch. A sheet that has not added the header yet still loads,
 * and the column reads as empty. Writes fill the next column, so values line up once
 * the header is added.
 */
export const OPTIONAL_TRAILING_HEADERS: Partial<Record<SheetName, string>> = {
  Applications: "last_position",
};
