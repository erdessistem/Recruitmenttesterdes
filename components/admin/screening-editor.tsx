"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  MAX_QUESTIONS,
  MAX_QUESTION_LENGTH,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type QuestionType,
  type ScreeningQuestion,
} from "@/lib/public/screening";
import { Button } from "@/components/ui/button";

function newId() {
  return crypto.randomUUID().slice(0, 8);
}

/**
 * Edits a vacancy's screening questions. The list is sent as JSON in a hidden
 * field, so it saves together with the rest of the vacancy form.
 */
export function ScreeningEditor({
  initial,
  error,
}: {
  initial: ScreeningQuestion[];
  error?: string[];
}) {
  const [questions, setQuestions] = useState<ScreeningQuestion[]>(initial);

  function update(index: number, patch: Partial<ScreeningQuestion>) {
    setQuestions((list) => list.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }
  function move(index: number, by: number) {
    setQuestions((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold">Pertanyaan screening</legend>
      <p className="text-sm text-muted">
        Ditanyakan di formulir lamaran, maksimal {MAX_QUESTIONS}. Untuk pertanyaan Ya/Tidak, pilih
        jawaban yang diharapkan: jawaban lain ditandai &quot;Tidak sesuai&quot; untuk HR, tanpa
        menolak pelamar otomatis. Pelamar tidak melihat jawaban yang diharapkan.
      </p>
      <input type="hidden" name="screening_questions" value={JSON.stringify(questions)} />
      {error && (
        <ul className="rounded-control bg-danger-soft p-3 text-sm text-danger">
          {error.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {questions.length > 0 && (
        <ol className="space-y-3">
          {questions.map((question, index) => (
            <li key={question.id} className="rounded-panel border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="tabular mt-2.5 text-sm font-semibold text-muted">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <label className="block text-sm font-semibold">
                    Pertanyaan
                    <input
                      className="control mt-2 font-normal"
                      value={question.text}
                      maxLength={MAX_QUESTION_LENGTH}
                      placeholder="Contoh: Bersedia ditempatkan di Cilacap?"
                      onChange={(event) => update(index, { text: event.target.value })}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-sm font-semibold">
                      Jenis jawaban
                      <select
                        className="control mt-2 font-normal"
                        value={question.type}
                        onChange={(event) => {
                          const type = event.target.value as QuestionType;
                          update(index, {
                            type,
                            expected: type === "yes_no" ? question.expected : null,
                          });
                        }}
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {QUESTION_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {question.type === "yes_no" && (
                      <label className="block text-sm font-semibold">
                        Jawaban yang diharapkan
                        <select
                          className="control mt-2 font-normal"
                          value={question.expected ?? ""}
                          onChange={(event) =>
                            update(index, {
                              expected: (event.target.value || null) as "yes" | "no" | null,
                            })
                          }
                        >
                          <option value="">Tidak ada</option>
                          <option value="yes">Ya</option>
                          <option value="no">Tidak</option>
                        </select>
                      </label>
                    )}
                    <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={question.required}
                        onChange={(event) => update(index, { required: event.target.checked })}
                      />
                      Wajib dijawab
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    className="min-h-9 px-2"
                    aria-label={`Naikkan pertanyaan ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 px-2"
                    aria-label={`Turunkan pertanyaan ${index + 1}`}
                    disabled={index === questions.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 px-2 text-danger"
                    aria-label={`Hapus pertanyaan ${index + 1}`}
                    onClick={() => setQuestions((list) => list.filter((_, i) => i !== index))}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {questions.length < MAX_QUESTIONS && (
        <Button
          variant="secondary"
          onClick={() =>
            setQuestions((list) => [
              ...list,
              { id: newId(), text: "", type: "yes_no", required: true, expected: null },
            ])
          }
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Tambah pertanyaan
        </Button>
      )}
      <p className="text-xs text-muted">
        Mengubah pertanyaan tidak mengubah jawaban yang sudah masuk; setiap lamaran menyimpan
        pertanyaan sesuai saat dikirim.
      </p>
    </fieldset>
  );
}
