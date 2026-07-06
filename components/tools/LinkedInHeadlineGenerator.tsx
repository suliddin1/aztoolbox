"use client";

import { CopyButton } from "@/components/CopyButton";
import { RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Role = "CS Student" | "Frontend Developer" | "Full Stack Developer" | "Software Engineer" | "Freelancer" | "Custom";
type Positioning = "clean" | "student" | "portfolio" | "entrepreneurial";

const roleOptions: Role[] = [
  "CS Student",
  "Frontend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Freelancer",
  "Custom",
];

const examples = [
  {
    role: "CS Student" as Role,
    skills: "React, Next.js, TypeScript",
    focus: "Building web apps",
  },
  {
    role: "Frontend Developer" as Role,
    skills: "React, UI, Performance",
    focus: "Clean, fast web interfaces",
  },
];

function joinSkills(skills: string) {
  const parts = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} & ${parts.at(-1)}`;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeHeadlines(role: string, skills: string, focus: string, positioning: Positioning) {
  const skillText = joinSkills(skills) || "Practical Web Tools";
  const focusText = focus.trim() || "Building useful products";
  const focusTitle = titleCase(focusText);
  const styleLine =
    positioning === "student"
      ? "Learning by building practical projects"
      : positioning === "portfolio"
        ? "Building clean portfolio-ready products"
        : positioning === "entrepreneurial"
          ? "Turning ideas into useful digital products"
          : "Clean, practical and reliable work";

  return [
    `${role} | ${skillText} | ${focusTitle}`,
    `${role} building practical web tools with ${skillText}`,
    `${role} focused on ${focusText}`,
    `${role} | ${styleLine}`,
    `${role} | ${skillText} | Clean, fast web interfaces`,
    `${role} helping teams build better digital experiences`,
    `${skillText} developer focused on ${focusText}`,
    `${role} | Web Apps, UI and practical product thinking`,
  ].filter((headline, index, list) => list.indexOf(headline) === index);
}

export function LinkedInHeadlineGenerator() {
  const [role, setRole] = useState<Role>("CS Student");
  const [customRole, setCustomRole] = useState("");
  const [skills, setSkills] = useState("React, Next.js, TypeScript");
  const [focus, setFocus] = useState("Building web apps");
  const [positioning, setPositioning] = useState<Positioning>("clean");
  const [hasGenerated, setHasGenerated] = useState(false);
  const roleText = role === "Custom" ? customRole.trim() || "Professional" : role;
  const headlines = useMemo(
    () => (hasGenerated ? makeHeadlines(roleText, skills, focus, positioning) : []),
    [focus, hasGenerated, positioning, roleText, skills],
  );

  function clear() {
    setRole("CS Student");
    setCustomRole("");
    setSkills("React, Next.js, TypeScript");
    setFocus("Building web apps");
    setPositioning("clean");
    setHasGenerated(false);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Status / role</label>
            <select value={role} onChange={(event) => { setRole(event.target.value as Role); setHasGenerated(false); }} className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent">
              {roleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          {role === "Custom" ? (
            <div>
              <label className="mb-2 block text-sm font-semibold">Custom role</label>
              <input value={customRole} onChange={(event) => { setCustomRole(event.target.value); setHasGenerated(false); }} placeholder="Məsələn: Product Designer" className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent" />
            </div>
          ) : null}
          <div>
            <label className="mb-2 block text-sm font-semibold">Əsas bacarıqlar</label>
            <input value={skills} onChange={(event) => { setSkills(event.target.value); setHasGenerated(false); }} placeholder="React, Next.js, TypeScript" className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Focus area</label>
            <input value={focus} onChange={(event) => { setFocus(event.target.value); setHasGenerated(false); }} placeholder="Building web apps" className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Positioning</label>
            <select value={positioning} onChange={(event) => { setPositioning(event.target.value as Positioning); setHasGenerated(false); }} className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent">
              <option value="clean">Clean and professional</option>
              <option value="student">Student-friendly</option>
              <option value="portfolio">Developer portfolio style</option>
              <option value="entrepreneurial">Entrepreneurial</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setHasGenerated(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"><Sparkles size={16} />Headline yarat</button>
          <CopyButton value={headlines.join("\n")} label="Hamısını kopyala" disabled={!headlines.length} />
          <button type="button" onClick={clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"><RotateCcw size={16} />Təmizlə</button>
        </div>

        <div className="mt-5 rounded-md border border-line bg-surface-soft p-4 text-sm text-muted">
          <p className="font-semibold text-foreground">Nümunələr</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                type="button"
                key={example.role}
                onClick={() => {
                  setRole(example.role);
                  setSkills(example.skills);
                  setFocus(example.focus);
                  setHasGenerated(false);
                }}
                className="rounded-md border border-line bg-white px-3 py-2 text-left transition hover:border-accent"
              >
                {example.role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Headline variantları</h2>
        <div className="mt-3 grid gap-3">
          {headlines.length ? (
            headlines.map((headline) => (
              <div key={headline} className="rounded-md border border-line bg-surface-soft p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{headline}</p>
                    <p className={`mt-2 text-xs ${headline.length > 120 ? "text-danger" : "text-muted"}`}>
                      {headline.length} simvol {headline.length > 120 ? "· çox uzun ola bilər" : ""}
                    </p>
                  </div>
                  <CopyButton value={headline} />
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-line bg-surface-soft p-4 text-sm text-muted">
              Formanı doldurub “Headline yarat” düyməsinə basın.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
