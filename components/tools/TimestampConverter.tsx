"use client";

import { Clock3, Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/browser/download";
import {
  dateToTimestamps,
  formatRelativeTime,
  timestampToDate,
  type TimestampUnit,
} from "@/lib/timestamp";
import {
  inputClass,
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

type DateResult = { date: Date; unit: TimestampUnit };

function localInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function TimestampConverter() {
  const [timestamp, setTimestamp] = useState("");
  const [unit, setUnit] = useState<"auto" | TimestampUnit>("auto");
  const [dateResult, setDateResult] = useState<DateResult | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [unixResult, setUnixResult] = useState<{
    seconds: number;
    milliseconds: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Yerli saat qurşağı";

  function convertTimestamp() {
    setError("");
    setSuccess("");
    try {
      const result = timestampToDate(timestamp, unit);
      setDateResult(result);
      setSuccess("Unix timestamp tarixə çevrildi.");
    } catch (caught) {
      setDateResult(null);
      setError(
        caught instanceof Error ? caught.message : "Timestamp çevrilə bilmədi.",
      );
    }
  }

  function convertDate() {
    setError("");
    setSuccess("");
    try {
      if (!dateInput) throw new Error("Tarix və saat seçin.");
      const result = dateToTimestamps(new Date(dateInput));
      setUnixResult(result);
      setSuccess("Tarix Unix timestamp-a çevrildi.");
    } catch (caught) {
      setUnixResult(null);
      setError(
        caught instanceof Error ? caught.message : "Tarix çevrilə bilmədi.",
      );
    }
  }

  function useCurrentTime() {
    const now = new Date();
    setTimestamp(String(now.getTime()));
    setUnit("milliseconds");
    setDateInput(localInputValue(now));
    setDateResult({ date: now, unit: "milliseconds" });
    setUnixResult(dateToTimestamps(now));
    setError("");
    setSuccess("Cari cihaz vaxtı əlavə edildi.");
  }

  function reset() {
    setTimestamp("");
    setDateInput("");
    setDateResult(null);
    setUnixResult(null);
    setError("");
    setSuccess("");
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolCard title="Unix timestamp → tarix">
          <label className="block text-sm font-semibold">
            Timestamp
            <input
              className={`${inputClass} mt-2 font-mono`}
              value={timestamp}
              inputMode="numeric"
              onChange={(event) => {
                setTimestamp(event.target.value);
                setDateResult(null);
              }}
              placeholder="1700000000 və ya 1700000000000"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Vahid
            <select
              className={`${inputClass} mt-2`}
              value={unit}
              onChange={(event) => {
                setUnit(event.target.value as typeof unit);
                setDateResult(null);
              }}
            >
              <option value="auto">Avtomatik aşkar et</option>
              <option value="seconds">Saniyə</option>
              <option value="milliseconds">Millisaniyə</option>
            </select>
          </label>
          <button
            type="button"
            className={`${primaryButtonClass} mt-4 w-full`}
            onClick={convertTimestamp}
            disabled={!timestamp.trim()}
          >
            Tarixə çevir
          </button>
          {dateResult ? (
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-xl bg-surface-soft p-3">
                <span className="text-muted">Aşkar edilən vahid</span>
                <strong className="block">
                  {dateResult.unit === "seconds"
                    ? "Unix saniyə"
                    : "Unix millisaniyə"}
                </strong>
              </div>
              {[
                [
                  `Yerli vaxt (${timezone})`,
                  dateResult.date.toLocaleString("az-AZ"),
                ],
                ["UTC", dateResult.date.toUTCString()],
                ["ISO 8601", dateResult.date.toISOString()],
                ["İndidən nisbi vaxt", formatRelativeTime(dateResult.date)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start gap-2 rounded-xl border border-line p-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted">{label}</span>
                    <p className="mt-1 break-all font-medium">{value}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-accent"
                    onClick={() => copyText(value)}
                    aria-label={`${label} kopyala`}
                  >
                    <Copy size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </ToolCard>
        <ToolCard title="Tarix → Unix timestamp">
          <label className="block text-sm font-semibold">
            Yerli tarix və saat ({timezone})
            <input
              className={`${inputClass} mt-2`}
              type="datetime-local"
              value={dateInput}
              onChange={(event) => {
                setDateInput(event.target.value);
                setUnixResult(null);
              }}
            />
          </label>
          <button
            type="button"
            className={`${primaryButtonClass} mt-4 w-full`}
            onClick={convertDate}
            disabled={!dateInput}
          >
            Unix-ə çevir
          </button>
          {unixResult ? (
            <div className="mt-4 grid gap-3">
              {[
                ["Unix saniyə", String(unixResult.seconds)],
                ["Unix millisaniyə", String(unixResult.milliseconds)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-line bg-surface-soft p-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted">{label}</span>
                    <p className="break-all font-mono font-semibold">{value}</p>
                  </div>
                  <button
                    type="button"
                    className="text-accent"
                    onClick={() => copyText(value)}
                    aria-label={`${label} kopyala`}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </ToolCard>
      </div>
      <ToolCard>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={useCurrentTime}
          >
            <Clock3 size={16} />
            Cari vaxt
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={reset}
          >
            <RotateCcw size={16} />
            Təmizlə
          </button>
        </div>
        <StatusMessage error={error} success={success} />
        <div className="mt-4">
          <PrivacyNotice />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Vaxt cihazınızın sistem saatından və brauzer saat qurşağından
          götürülür; xarici vaxt API-si istifadə edilmir. UTC və yerli etiketlər
          ayrıca göstərilir.
        </p>
      </ToolCard>
    </div>
  );
}
