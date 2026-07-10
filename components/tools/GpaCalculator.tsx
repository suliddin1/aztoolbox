"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type Course = {
  id: string;
  name: string;
  credit: string;
  score: string;
};

const emptyCourse = (id: number): Course => ({
  id: `course-${id}`,
  name: "",
  credit: "",
  score: "",
});

const sampleCourses: Course[] = [
  { id: "sample-1", name: "Proqramlaşdırma", credit: "6", score: "91" },
  { id: "sample-2", name: "Riyaziyyat", credit: "5", score: "84" },
  { id: "sample-3", name: "İngilis dili", credit: "3", score: "78" },
];

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function approximateGpa(score: number) {
  if (score >= 95) return 4;
  if (score >= 90) return 3.7;
  if (score >= 85) return 3.3;
  if (score >= 80) return 3;
  if (score >= 75) return 2.7;
  if (score >= 70) return 2.3;
  if (score >= 65) return 2;
  if (score >= 60) return 1.7;
  if (score >= 51) return 1;
  return 0;
}

export function GpaCalculator() {
  const [courses, setCourses] = useState<Course[]>([emptyCourse(1)]);
  const [nextId, setNextId] = useState(2);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    let totalCredits = 0;
    let weightedScore = 0;

    courses.forEach((course) => {
      const credit = parseNumber(course.credit);
      const score = parseNumber(course.score);
      if (credit > 0 && score >= 0 && score <= 100) {
        totalCredits += credit;
        weightedScore += credit * score;
      }
    });

    const average = totalCredits ? weightedScore / totalCredits : 0;
    return { totalCredits, average, gpa: approximateGpa(average) };
  }, [courses]);

  function updateCourse(id: string, patch: Partial<Course>) {
    setError("");
    setCourses((current) =>
      current.map((course) =>
        course.id === id ? { ...course, ...patch } : course,
      ),
    );
  }

  function addCourse() {
    setCourses((current) => [...current, emptyCourse(nextId)]);
    setNextId((current) => current + 1);
  }

  function removeCourse(id: string) {
    setCourses((current) =>
      current.length === 1
        ? current
        : current.filter((course) => course.id !== id),
    );
  }

  function validate() {
    const invalidCredit = courses.some(
      (course) => parseNumber(course.credit) < 0,
    );
    const invalidScore = courses.some((course) => {
      if (!course.score.trim()) return false;
      const score = parseNumber(course.score);
      return score < 0 || score > 100;
    });

    if (invalidCredit) {
      setError("Kredit mənfi ola bilməz.");
      return;
    }
    if (invalidScore) {
      setError("Bal 0–100 aralığında olmalıdır.");
      return;
    }

    setError("");
  }

  function fillSample() {
    setCourses(sampleCourses);
    setNextId(4);
    setError("");
  }

  function clear() {
    setCourses([emptyCourse(1)]);
    setNextId(2);
    setError("");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-semibold">Fənlər</h2>
          <button
            type="button"
            onClick={addCourse}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold transition hover:border-accent"
          >
            <Plus size={15} />
            Fənn əlavə et
          </button>
        </div>

        <div className="grid gap-3">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className="grid gap-3 rounded-md border border-line bg-surface-soft p-3 lg:grid-cols-[1fr_110px_110px_40px]"
            >
              <input
                value={course.name}
                onChange={(event) =>
                  updateCourse(course.id, { name: event.target.value })
                }
                placeholder={`Fənn adı ${index + 1}`}
                aria-label={`Fənn adı ${index + 1}`}
                className="h-10 rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
              />
              <input
                inputMode="decimal"
                value={course.credit}
                onBlur={validate}
                onChange={(event) =>
                  updateCourse(course.id, {
                    credit: event.target.value.replace(",", "."),
                  })
                }
                placeholder="Kredit"
                aria-label={`Fənn ${index + 1} krediti`}
                className="h-10 rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
              />
              <input
                inputMode="decimal"
                value={course.score}
                onBlur={validate}
                onChange={(event) =>
                  updateCourse(course.id, {
                    score: event.target.value.replace(",", "."),
                  })
                }
                placeholder="Bal"
                aria-label={`Fənn ${index + 1} balı`}
                className="h-10 rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
              />
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                disabled={courses.length === 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-danger hover:text-danger disabled:opacity-40"
                title="Sil"
                aria-label="Fənni sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillSample}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Nümunə doldur
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Nəticə</h2>
        <div className="mt-4 grid gap-3">
          <div className="rounded-md border border-line bg-surface-soft p-4">
            <p className="text-sm text-muted">Ümumi kredit</p>
            <p className="mt-1 text-2xl font-semibold">
              {result.totalCredits.toFixed(1)}
            </p>
          </div>
          <div className="rounded-md border border-line bg-surface-soft p-4">
            <p className="text-sm text-muted">Çəkili orta bal</p>
            <p className="mt-1 text-2xl font-semibold">
              {result.average.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border border-line bg-surface-soft p-4">
            <p className="text-sm text-muted">Təxmini 4.0 GPA</p>
            <p className="mt-1 text-2xl font-semibold">
              {result.gpa.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          4.0 GPA çevirməsi təxminidir və universitet qaydalarına görə fərqlənə
          bilər.
        </p>
      </div>
    </section>
  );
}
