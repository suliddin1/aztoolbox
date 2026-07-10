"use client";

import { Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/browser/download";
import { decodeJwt, formatJwtTimestamp, type DecodedJwt } from "@/lib/jwt";
import {
  primaryButtonClass,
  PrivacyNotice,
  secondaryButtonClass,
  StatusMessage,
  textareaClass,
  ToolCard,
} from "@/components/tools/shared/ToolUi";

const commonClaims = ["iss", "sub", "aud", "iat", "nbf", "exp", "jti"] as const;

export function JwtDecoder() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function run() {
    setError("");
    setSuccess("");
    try {
      const result = decodeJwt(token);
      setDecoded(result);
      setSuccess("JWT header və payload decode edildi.");
    } catch (caught) {
      setDecoded(null);
      setError(
        caught instanceof Error ? caught.message : "JWT decode edilə bilmədi.",
      );
    }
  }

  function reset() {
    setToken("");
    setDecoded(null);
    setError("");
    setSuccess("");
  }

  return (
    <div className="grid gap-5">
      <ToolCard>
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
          JWT-ni decode etmək imzanı yoxlamır və tokenin etibarlı olduğunu sübut
          etmir.
        </p>
        <label className="block text-sm font-semibold">
          JWT
          <textarea
            className={`${textareaClass} mt-2 min-h-44 break-all`}
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setDecoded(null);
              setError("");
              setSuccess("");
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="eyJhbGciOi..."
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={run}
            disabled={!token.trim()}
          >
            Decode et
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
      </ToolCard>
      {decoded ? (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <ToolCard title="Header">
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
              <button
                type="button"
                className={`${secondaryButtonClass} mt-3`}
                onClick={() =>
                  copyText(JSON.stringify(decoded.header, null, 2))
                }
              >
                <Copy size={16} />
                Header-i kopyala
              </button>
            </ToolCard>
            <ToolCard title="Payload">
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
              <button
                type="button"
                className={`${secondaryButtonClass} mt-3`}
                onClick={() =>
                  copyText(JSON.stringify(decoded.payload, null, 2))
                }
              >
                <Copy size={16} />
                Payload-u kopyala
              </button>
            </ToolCard>
          </div>
          <ToolCard title="Ümumi claim-lər">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="p-3">Claim</th>
                    <th className="p-3">Dəyər</th>
                    <th className="p-3">Vaxt izahı</th>
                  </tr>
                </thead>
                <tbody>
                  {commonClaims.map((claim) => {
                    const value = decoded.payload[claim];
                    const time = ["iat", "nbf", "exp"].includes(claim)
                      ? formatJwtTimestamp(value)
                      : null;
                    return (
                      <tr
                        key={claim}
                        className="border-b border-line/70 align-top"
                      >
                        <th className="p-3 font-mono">{claim}</th>
                        <td className="max-w-md break-all p-3 font-mono text-xs">
                          {value === undefined
                            ? "—"
                            : typeof value === "string"
                              ? value
                              : JSON.stringify(value)}
                        </td>
                        <td className="p-3 text-xs leading-5 text-muted">
                          {time ? (
                            <>
                              {time.local} (yerli)
                              <br />
                              {time.utc} (UTC)
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {decoded.expired !== null ? (
              <p
                className={`mt-4 rounded-xl p-3 text-sm font-semibold ${decoded.expired ? "bg-red-50 text-danger" : "bg-emerald-50 text-emerald-800"}`}
              >
                {decoded.expired
                  ? "Payload-dakı exp vaxtına görə token vaxtı keçmiş görünür."
                  : "Payload-dakı exp vaxtına görə token hələ vaxtı keçmiş görünmür."}{" "}
                Bu yalnız decode edilmiş claim şərhidir, etibarlılıq yoxlaması
                deyil.
              </p>
            ) : (
              <p className="mt-4 rounded-xl bg-surface-soft p-3 text-sm text-muted">
                Payload-da rəqəm tipli exp claim-i yoxdur.
              </p>
            )}
          </ToolCard>
        </>
      ) : null}
    </div>
  );
}
