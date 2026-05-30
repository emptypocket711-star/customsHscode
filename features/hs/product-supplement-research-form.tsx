"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type SupplementResearchFormProps = {
  basisDate: string;
  destinationCountry: string;
  direction: "import" | "export";
  originCountry: string;
  productName: string;
  questions: string[];
  tone?: "blue" | "amber";
};

export function ProductSupplementResearchForm({
  basisDate,
  destinationCountry,
  direction,
  originCountry,
  productName,
  questions,
  tone = "blue"
}: SupplementResearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const visibleQuestions = useMemo(() => questions.slice(0, 4), [questions]);
  const [answers, setAnswers] = useState(() => visibleQuestions.map(() => ""));
  const hasAnswer = answers.some((answer) => answer.trim().length > 0);
  const borderClass = tone === "amber" ? "border-amber-100" : "border-blue-100";
  const labelClass = tone === "amber" ? "text-amber-900" : "text-blue-900";

  function submitSupplement() {
    const supplementLines = visibleQuestions
      .map((question, index) => ({ question, answer: answers[index]?.trim() ?? "" }))
      .filter((item) => item.answer.length > 0)
      .map((item) => `- ${item.question}: ${item.answer}`);

    if (!supplementLines.length) return;

    const params = new URLSearchParams({
      query: `${productName}\n보완정보:\n${supplementLines.join("\n")}`,
      direction,
      destinationCountry,
      originCountry,
      basisDate
    });

    startTransition(() => {
      router.push(`/hs/direct?${params.toString()}`);
    });
  }

  if (!visibleQuestions.length) return null;

  return (
    <div className={`rounded-md border bg-white p-3 ${borderClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs font-semibold ${labelClass}`}>보완사항 입력</p>
        <button
          className="focus-ring inline-flex items-center justify-center rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          data-navigation-progress="보완검색"
          disabled={!hasAnswer || isPending}
          onClick={submitSupplement}
          type="button"
        >
          {isPending ? "재조회 중" : "보완사항 적용하여 재조회"}
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {visibleQuestions.map((question, index) => (
          <label className="grid gap-1 text-xs font-semibold text-slate-700" key={question}>
            <span>{question}</span>
            <textarea
              className="focus-ring min-h-20 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm font-normal leading-6 text-slate-900"
              onChange={(event) => {
                const nextAnswers = [...answers];
                nextAnswers[index] = event.target.value;
                setAnswers(nextAnswers);
              }}
              placeholder="확인한 보완사항을 입력하세요"
              value={answers[index] ?? ""}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
