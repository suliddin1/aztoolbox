"use client";

import { Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useMemo, useState } from "react";

type Entry = {
  id: string;
  title: string;
  subtitle: string;
  details: string;
};

type CvForm = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  skills: string;
  languages: string;
};

const initialForm: CvForm = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  linkedin: "",
  github: "",
  portfolio: "",
  summary: "",
  skills: "",
  languages: "",
};

const emptyEntry = (prefix: string, id: number): Entry => ({
  id: `${prefix}-${id}`,
  title: "",
  subtitle: "",
  details: "",
});

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let cursorY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

export function CvBuilder() {
  const [form, setForm] = useState<CvForm>(initialForm);
  const [education, setEducation] = useState<Entry[]>([emptyEntry("edu", 1)]);
  const [projects, setProjects] = useState<Entry[]>([emptyEntry("project", 1)]);
  const [experience, setExperience] = useState<Entry[]>([emptyEntry("exp", 1)]);
  const [nextId, setNextId] = useState(2);
  const [status, setStatus] = useState("");

  const contactLine = useMemo(
    () => [form.email, form.phone, form.city].filter(Boolean).join(" · "),
    [form.city, form.email, form.phone],
  );
  const linkLine = useMemo(
    () => [form.linkedin, form.github, form.portfolio].filter(Boolean).join(" · "),
    [form.github, form.linkedin, form.portfolio],
  );

  function updateField(field: keyof CvForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus("");
  }

  function updateEntry(kind: "education" | "projects" | "experience", id: string, patch: Partial<Entry>) {
    const update = (items: Entry[]) => items.map((item) => (item.id === id ? { ...item, ...patch } : item));
    if (kind === "education") setEducation(update);
    if (kind === "projects") setProjects(update);
    if (kind === "experience") setExperience(update);
    setStatus("");
  }

  function addEntry(kind: "education" | "projects" | "experience") {
    const prefix = kind === "education" ? "edu" : kind === "projects" ? "project" : "exp";
    const entry = emptyEntry(prefix, nextId);
    setNextId((current) => current + 1);
    if (kind === "education") setEducation((current) => [...current, entry]);
    if (kind === "projects") setProjects((current) => [...current, entry]);
    if (kind === "experience") setExperience((current) => [...current, entry]);
  }

  function removeEntry(kind: "education" | "projects" | "experience", id: string) {
    const remove = (items: Entry[]) => (items.length === 1 ? items : items.filter((item) => item.id !== id));
    if (kind === "education") setEducation(remove);
    if (kind === "projects") setProjects(remove);
    if (kind === "experience") setExperience(remove);
  }

  function clear() {
    setForm(initialForm);
    setEducation([emptyEntry("edu", 1)]);
    setProjects([emptyEntry("project", 1)]);
    setExperience([emptyEntry("exp", 1)]);
    setNextId(2);
    setStatus("");
  }

  function downloadPdf() {
    setStatus("");
    if (!form.fullName.trim()) {
      setStatus("Ad Soyad mütləqdir.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("PDF hazırlamaq mümkün olmadı.");
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#17211d";
    ctx.font = "700 54px Arial";
    ctx.fillText(form.fullName, 80, 105);
    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#63716b";
    if (contactLine) ctx.fillText(contactLine, 80, 150);
    if (linkLine) ctx.fillText(linkLine, 80, 185);

    let y = 250;
    const section = (title: string) => {
      ctx.fillStyle = "#12715b";
      ctx.font = "700 25px Arial";
      ctx.fillText(title, 80, y);
      y += 38;
      ctx.fillStyle = "#17211d";
      ctx.font = "400 23px Arial";
    };

    const entries = (items: Entry[]) => {
      items.filter((item) => item.title || item.subtitle || item.details).forEach((item) => {
        ctx.fillStyle = "#17211d";
        ctx.font = "700 24px Arial";
        if (item.title) ctx.fillText(item.title, 80, y);
        y += item.title ? 30 : 0;
        ctx.fillStyle = "#63716b";
        ctx.font = "400 21px Arial";
        if (item.subtitle) ctx.fillText(item.subtitle, 80, y);
        y += item.subtitle ? 28 : 0;
        ctx.fillStyle = "#17211d";
        ctx.font = "400 22px Arial";
        if (item.details) y = drawWrappedText(ctx, item.details, 80, y, 1050, 29);
        y += 22;
      });
    };

    if (form.summary.trim()) {
      section("Qısa haqqında");
      y = drawWrappedText(ctx, form.summary, 80, y, 1050, 30) + 25;
    }
    if (education.some((item) => item.title || item.subtitle || item.details)) {
      section("Təhsil");
      entries(education);
    }
    if (form.skills.trim()) {
      section("Bacarıqlar");
      y = drawWrappedText(ctx, form.skills, 80, y, 1050, 30) + 25;
    }
    if (projects.some((item) => item.title || item.subtitle || item.details)) {
      section("Layihələr");
      entries(projects);
    }
    if (experience.some((item) => item.title || item.subtitle || item.details)) {
      section("İş təcrübəsi");
      entries(experience);
    }
    if (form.languages.trim()) {
      section("Dillər");
      y = drawWrappedText(ctx, form.languages, 80, y, 1050, 30);
    }

    ctx.font = "400 18px Arial";
    ctx.fillStyle = "#63716b";
    ctx.fillText("CV AzToolbox ilə brauzerdə yaradılıb.", 80, 1685);

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 595.28, 841.89);
    pdf.save("aztoolbox-cv.pdf");
    setStatus("PDF yükləmə başladı.");
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["fullName", "Ad Soyad"],
            ["email", "Email"],
            ["phone", "Telefon"],
            ["city", "Şəhər"],
            ["linkedin", "LinkedIn"],
            ["github", "GitHub"],
            ["portfolio", "Portfolio website"],
          ] as Array<[keyof CvForm, string]>).map(([field, label]) => (
            <div key={field}>
              <label className="mb-2 block text-sm font-semibold">{label}</label>
              <input
                value={form[field]}
                onChange={(event) => updateField(field, event.target.value)}
                className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
              />
            </div>
          ))}
        </div>

        <TextArea label="Qısa haqqında" value={form.summary} onChange={(value) => updateField("summary", value)} />
        <EntryEditor title="Təhsil" items={education} kind="education" onAdd={addEntry} onRemove={removeEntry} onUpdate={updateEntry} />
        <TextArea label="Bacarıqlar" value={form.skills} onChange={(value) => updateField("skills", value)} />
        <EntryEditor title="Layihələr" items={projects} kind="projects" onAdd={addEntry} onRemove={removeEntry} onUpdate={updateEntry} />
        <EntryEditor title="İş təcrübəsi" items={experience} kind="experience" onAdd={addEntry} onRemove={removeEntry} onUpdate={updateEntry} />
        <TextArea label="Dillər" value={form.languages} onChange={(value) => updateField("languages", value)} />

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={downloadPdf} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong">
            <Download size={16} />
            PDF yüklə
          </button>
          <button type="button" onClick={clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent">
            <RotateCcw size={16} />
            Formanı təmizlə
          </button>
        </div>
        {status ? <p className={`mt-3 text-sm ${status.includes("başladı") ? "text-accent-strong" : "text-danger"}`}>{status}</p> : null}
        <p className="mt-4 text-sm leading-6 text-muted">
          CV məlumatlarınız serverə göndərilmir.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Live CV preview</h2>
        <div className="mt-4 rounded-lg border border-line bg-white p-6">
          <h3 className="text-3xl font-semibold">{form.fullName || "Ad Soyad"}</h3>
          <p className="mt-2 text-sm text-muted">{contactLine || "Email · Telefon · Şəhər"}</p>
          <p className="mt-1 text-sm text-muted">{linkLine || "LinkedIn · GitHub · Portfolio"}</p>
          <PreviewBlock title="Qısa haqqında" text={form.summary} />
          <PreviewEntries title="Təhsil" items={education} />
          <PreviewBlock title="Bacarıqlar" text={form.skills} />
          <PreviewEntries title="Layihələr" items={projects} />
          <PreviewEntries title="İş təcrübəsi" items={experience} />
          <PreviewBlock title="Dillər" text={form.languages} />
        </div>
      </div>
    </section>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent" />
    </div>
  );
}

function EntryEditor({
  title,
  items,
  kind,
  onAdd,
  onRemove,
  onUpdate,
}: {
  title: string;
  items: Entry[];
  kind: "education" | "projects" | "experience";
  onAdd: (kind: "education" | "projects" | "experience") => void;
  onRemove: (kind: "education" | "projects" | "experience", id: string) => void;
  onUpdate: (kind: "education" | "projects" | "experience", id: string, patch: Partial<Entry>) => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <button type="button" onClick={() => onAdd(kind)} className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold transition hover:border-accent">
          <Plus size={15} />
          Əlavə et
        </button>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-line bg-surface-soft p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_40px]">
              <input value={item.title} onChange={(event) => onUpdate(kind, item.id, { title: event.target.value })} placeholder="Başlıq" aria-label={`${title} başlığı`} className="h-10 rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent" />
              <input value={item.subtitle} onChange={(event) => onUpdate(kind, item.id, { subtitle: event.target.value })} placeholder="Alt məlumat / tarix" aria-label={`${title} alt məlumatı və ya tarixi`} className="h-10 rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent" />
              <button type="button" onClick={() => onRemove(kind, item.id)} disabled={items.length === 1} aria-label={`${title} sətrini sil`} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-danger hover:text-danger disabled:opacity-40">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea value={item.details} onChange={(event) => onUpdate(kind, item.id, { details: event.target.value })} rows={3} placeholder="Detallar" aria-label={`${title} detalları`} className="mt-3 w-full resize-y rounded-md border border-line bg-white p-3 leading-6 outline-none transition focus:border-accent" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewBlock({ title, text }: { title: string; text: string }) {
  return text.trim() ? (
    <div className="mt-5">
      <h4 className="text-sm font-semibold uppercase text-accent-strong">{title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{text}</p>
    </div>
  ) : null;
}

function PreviewEntries({ title, items }: { title: string; items: Entry[] }) {
  const visible = items.filter((item) => item.title || item.subtitle || item.details);
  return visible.length ? (
    <div className="mt-5">
      <h4 className="text-sm font-semibold uppercase text-accent-strong">{title}</h4>
      <div className="mt-2 grid gap-3">
        {visible.map((item) => (
          <div key={item.id}>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted">{item.subtitle}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{item.details}</p>
          </div>
        ))}
      </div>
    </div>
  ) : null;
}
