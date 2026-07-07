"use client";

import { RotateCcw, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { tools } from "@/lib/tools";

const feedbackTypes = [
  "Problem bildirmək",
  "Yeni alət təklifi",
  "Dizayn/istifadə rahatlığı",
  "Digər",
];

export function FeedbackComposer() {
  const [type, setType] = useState(feedbackTypes[0]);
  const [tool, setTool] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [generated, setGenerated] = useState("");

  const canGenerate = useMemo(() => message.trim().length > 0, [message]);

  function generate() {
    if (!canGenerate) {
      return;
    }

    const lines = [
      "AzToolbox feedback",
      "",
      `Növ: ${type}`,
      tool ? `Alət: ${tool}` : "",
      "",
      "Mesaj:",
      message.trim(),
      contact.trim() ? "" : "",
      contact.trim() ? `Əlaqə: ${contact.trim()}` : "",
    ].filter(Boolean);

    setGenerated(lines.join("\n"));
  }

  function clear() {
    setType(feedbackTypes[0]);
    setTool("");
    setMessage("");
    setContact("");
    setGenerated("");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Feedback növü</label>
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setGenerated("");
              }}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              {feedbackTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Alət adı</label>
            <select
              value={tool}
              onChange={(event) => {
                setTool(event.target.value);
                setGenerated("");
              }}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              <option value="">Ümumi / uyğun deyil</option>
              {tools.map((item) => (
                <option key={item.slug} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Mesaj</label>
            <textarea
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setGenerated("");
              }}
              rows={8}
              placeholder="Problemi, təklifi və ya ideyanı buraya yazın..."
              className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Əlaqə (istəyə bağlı)</label>
            <input
              value={contact}
              onChange={(event) => {
                setContact(event.target.value);
                setGenerated("");
              }}
              placeholder="Email, GitHub username və ya başqa əlaqə yolu"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50"
          >
            <Wand2 size={16} />
            Mətni hazırla
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
        <p className="mt-4 rounded-md border border-line bg-surface-soft px-4 py-3 text-sm leading-6 text-muted">
          Hazırda feedback serverə göndərilmir. Mətni kopyalayıb layihə sahibinə
          göndərə və ya real repo varsa GitHub issue kimi paylaşa bilərsiniz.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Hazır feedback mətni</h2>
            <p className="mt-1 text-sm text-muted">{generated.length} simvol</p>
          </div>
          <CopyButton value={generated} />
        </div>
        <textarea
          value={generated}
          readOnly
          rows={16}
          placeholder="Mətni hazırla düyməsinə basdıqdan sonra nəticə burada görünəcək."
          className="w-full resize-y rounded-md border border-line bg-surface-soft p-3 leading-7 outline-none"
        />
      </div>
    </section>
  );
}
