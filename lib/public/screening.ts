import { z } from "zod";

/** Up to this many screening questions per vacancy. */
export const MAX_QUESTIONS = 5;
export const MAX_QUESTION_LENGTH = 200;
export const MAX_ANSWER_LENGTH = 500;

export const QUESTION_TYPES = ["yes_no", "text"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  yes_no: "Ya/Tidak",
  text: "Jawaban singkat",
};

const yesNo = z.enum(["yes", "no"]);

export const screeningQuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  text: z
    .string()
    .trim()
    .min(5, { error: "Pertanyaan minimal 5 karakter." })
    .max(MAX_QUESTION_LENGTH, { error: `Pertanyaan maksimal ${MAX_QUESTION_LENGTH} karakter.` }),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  /** For yes/no questions: the answer HR hopes for. Never sent to candidates. */
  expected: yesNo.nullable(),
});
export type ScreeningQuestion = z.infer<typeof screeningQuestionSchema>;

export const screeningQuestionsSchema = z
  .array(screeningQuestionSchema)
  .max(MAX_QUESTIONS, { error: `Maksimal ${MAX_QUESTIONS} pertanyaan.` })
  .refine((list) => new Set(list.map((q) => q.id)).size === list.length, {
    error: "ID pertanyaan ganda.",
  })
  .transform((list) =>
    list.map((q) => ({ ...q, expected: q.type === "yes_no" ? q.expected : null })),
  );

/** The answer as stored on the application, with the question copied so later edits don't change it. */
export const screeningAnswerSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  type: z.enum(QUESTION_TYPES),
  answer: z.string(),
  expected: yesNo.nullable(),
});
export type ScreeningAnswer = z.infer<typeof screeningAnswerSchema>;
export const screeningAnswersSchema = z.array(screeningAnswerSchema);

/** What candidates see: never the expected answer. */
export type PublicQuestion = Pick<ScreeningQuestion, "id" | "text" | "type" | "required">;
export function toPublicQuestions(questions: ScreeningQuestion[]): PublicQuestion[] {
  return questions.map(({ id, text, type, required }) => ({ id, text, type, required }));
}

export const fieldName = (id: string) => `q_${id}`;
export const isScreeningField = (name: string) => name.startsWith("q_");

function value(data: Record<string, unknown>, id: string) {
  const raw = data[fieldName(id)];
  return typeof raw === "string" ? raw.trim() : "";
}

/** Errors keyed by form field name, in the same shape as the main form's errors. */
export function screeningErrors(
  questions: PublicQuestion[],
  data: Record<string, unknown>,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const question of questions) {
    const answer = value(data, question.id);
    if (!answer) {
      if (question.required) errors[fieldName(question.id)] = ["Pertanyaan ini wajib dijawab."];
    } else if (question.type === "yes_no" && answer !== "yes" && answer !== "no") {
      errors[fieldName(question.id)] = ["Pilih Ya atau Tidak."];
    } else if (answer.length > MAX_ANSWER_LENGTH) {
      errors[fieldName(question.id)] = [`Jawaban maksimal ${MAX_ANSWER_LENGTH} karakter.`];
    }
  }
  return errors;
}

export function collectAnswers(
  questions: ScreeningQuestion[],
  data: Record<string, unknown>,
): ScreeningAnswer[] {
  return questions.map((question) => ({
    questionId: question.id,
    question: question.text,
    type: question.type,
    answer: value(data, question.id),
    expected: question.expected,
  }));
}

export function isMismatch(answer: ScreeningAnswer): boolean {
  return (
    answer.type === "yes_no" &&
    answer.expected !== null &&
    answer.answer !== "" &&
    answer.answer !== answer.expected
  );
}

export function hasMismatch(answers: ScreeningAnswer[]): boolean {
  return answers.some(isMismatch);
}

export function answerLabel(answer: Pick<ScreeningAnswer, "type" | "answer">): string {
  if (!answer.answer) return "—";
  if (answer.type === "yes_no") return answer.answer === "yes" ? "Ya" : "Tidak";
  return answer.answer;
}
