/** Ordered headers for the private spreadsheet. Settings uses key/value rows. */
export const SHEET_HEADERS = {
  Vacancies: ["id", "slug", "title", "position_code", "department", "location", "employment_type", "description", "requirements", "quota", "open_at", "close_at", "status", "created_at", "updated_at", "salary_min", "salary_max", "salary_visible", "screening_questions"],
  Applications: ["id", "token", "submission_key", "vacancy_id", "full_name", "whatsapp", "email", "city", "last_education", "major", "experience_years", "last_company", "last_salary", "expected_salary", "cv_url", "linkedin_url", "motivation", "availability", "source", "source_other", "consent", "consent_at", "privacy_version", "current_stage", "status", "applied_at", "closed_at", "anonymized_at", "updated_at", "last_position", "screening_answers", "reference_name", "reference_phone", "emergency_name", "emergency_relation", "emergency_phone", "birth_place", "birth_date", "gender", "marital_status", "religion", "children_count", "leave_reason", "parent_name", "parent_age", "parent_occupation", "parent_address", "hobbies", "achievements", "other_notes"],
  Stage_History: ["id", "application_id", "from_stage", "to_stage", "from_status", "to_status", "note", "changed_by", "changed_at", "note_is_public"],
  Notes: ["id", "application_id", "author_email", "body", "created_at"],
  Admin_Users: ["id", "email", "name", "password_hash", "role", "active", "session_version", "created_at", "last_login_at"],
  Settings: ["key", "value"],
} as const;
export type SheetName = keyof typeof SHEET_HEADERS;

/**
 * Columns added after launch, in order, at the end of their tab. A sheet that has not
 * added some of them yet still loads: those read as empty and are not written until
 * the headers exist.
 */
export const OPTIONAL_TRAILING_HEADERS: Partial<Record<SheetName, readonly string[]>> = {
  Vacancies: ["salary_min", "salary_max", "salary_visible", "screening_questions"],
  Applications: ["last_position", "screening_answers", "reference_name", "reference_phone", "emergency_name", "emergency_relation", "emergency_phone", "birth_place", "birth_date", "gender", "marital_status", "religion", "children_count", "leave_reason", "parent_name", "parent_age", "parent_occupation", "parent_address", "hobbies", "achievements", "other_notes"],
};

/** True when the headers are the full list, or the full list missing some trailing optional headers. */
export function acceptsHeaders(sheet: SheetName, headers: readonly unknown[]): boolean {
  const full = SHEET_HEADERS[sheet] as readonly string[];
  const optional = OPTIONAL_TRAILING_HEADERS[sheet] ?? [];
  const missing = full.length - headers.length;
  if (missing < 0 || missing > optional.length) return false;
  if (missing > 0 && full.slice(-missing).some((header) => !optional.includes(header))) return false;
  return headers.every((header, index) => header === full[index]);
}
