"use client";

import { Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useMemo, useState } from "react";
import { formatMoney, todayInputValue } from "@/lib/utils";

type LineItem = {
  id: string;
  name: string;
  quantity: string;
  price: string;
};

const initialItem = (): LineItem => ({
  id: "item-1",
  name: "",
  quantity: "1",
  price: "",
});

const newItem = (id: number): LineItem => ({
  id: `item-${id}`,
  name: "",
  quantity: "1",
  price: "",
});

function makeInvoiceNumber() {
  return `AZT-${new Date().getFullYear()}-0001`;
}

function parsePositiveNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function itemTotal(item: LineItem) {
  const quantity = Math.max(0, parsePositiveNumber(item.quantity));
  const price = Math.max(0, parsePositiveNumber(item.price));
  return quantity * price;
}

function normalizeNumberInput(value: string) {
  if (!value) {
    return "";
  }

  const normalized = value.replace(",", ".");
  if (!/^\d*\.?\d*$/.test(normalized)) {
    return null;
  }

  if (/^0\d/.test(normalized)) {
    return normalized.replace(/^0+/, "") || "0";
  }

  return normalized;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
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

  if (line) {
    ctx.fillText(line, x, cursorY);
  }

  return cursorY + lineHeight;
}

export function InvoiceGenerator() {
  const [seller, setSeller] = useState("");
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<LineItem[]>([initialItem()]);
  const [nextItemId, setNextItemId] = useState(2);
  const [currency, setCurrency] = useState("AZN");
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(makeInvoiceNumber);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + itemTotal(item), 0),
    [items],
  );

  function updateItem(id: string, patch: Partial<LineItem>) {
    setStatus("");
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function updateNumberItem(
    id: string,
    field: "quantity" | "price",
    value: string,
  ) {
    const normalized = normalizeNumberInput(value);
    if (normalized === null) {
      return;
    }

    updateItem(id, { [field]: normalized });
  }

  function addItem() {
    setItems((current) => [...current, newItem(nextItemId)]);
    setNextItemId((current) => current + 1);
    setStatus("");
  }

  function removeItem(id: string) {
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    );
    setStatus("");
  }

  function clear() {
    setSeller("");
    setCustomer("");
    setItems([initialItem()]);
    setNextItemId(2);
    setCurrency("AZN");
    setDate(todayInputValue());
    setNote("");
    setStatus("");
    setInvoiceNumber(makeInvoiceNumber());
  }

  function validate() {
    if (!seller.trim() || !customer.trim()) {
      return "Satıcı və müştəri adını daxil edin.";
    }

    if (items.some((item) => !item.name.trim())) {
      return "Bütün sətirlərdə xidmət / məhsul adını daxil edin.";
    }

    if (
      items.some(
        (item) =>
          parsePositiveNumber(item.quantity) < 0 ||
          parsePositiveNumber(item.price) < 0,
      )
    ) {
      return "Miqdar və qiymət mənfi ola bilməz.";
    }

    if (
      items.some(
        (item) =>
          !item.quantity.trim() || parsePositiveNumber(item.quantity) <= 0,
      )
    ) {
      return "Miqdar 0-dan böyük olmalıdır.";
    }

    return "";
  }

  function downloadPdf() {
    const validationError = validate();
    setStatus("");

    if (validationError) {
      setStatus(validationError);
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
    ctx.font = "700 42px Arial";
    ctx.fillText("AzToolbox", 80, 90);
    ctx.font = "700 58px Arial";
    ctx.fillText("Qəbz / Invoice", 80, 170);

    ctx.font = "400 24px Arial";
    ctx.fillStyle = "#63716b";
    ctx.fillText(`Invoice No: ${invoiceNumber}`, 80, 220);
    ctx.fillText(`Tarix: ${date}`, 80, 258);

    ctx.strokeStyle = "#dde5e0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 310);
    ctx.lineTo(1160, 310);
    ctx.stroke();

    ctx.fillStyle = "#17211d";
    ctx.font = "700 26px Arial";
    ctx.fillText("Satıcı", 80, 370);
    ctx.fillText("Müştəri", 650, 370);
    ctx.font = "400 28px Arial";
    drawWrappedText(ctx, seller, 80, 414, 450, 34);
    drawWrappedText(ctx, customer, 650, 414, 450, 34);

    const tableTop = 550;
    ctx.fillStyle = "#f1f6f3";
    ctx.fillRect(80, tableTop, 1080, 58);
    ctx.fillStyle = "#17211d";
    ctx.font = "700 23px Arial";
    ctx.fillText("Xidmət / məhsul", 105, tableTop + 37);
    ctx.fillText("Miqdar", 650, tableTop + 37);
    ctx.fillText("Qiymət", 790, tableTop + 37);
    ctx.fillText("Cəmi", 980, tableTop + 37);

    ctx.font = "400 23px Arial";
    let y = tableTop + 105;
    items.forEach((item) => {
      const quantity = parsePositiveNumber(item.quantity);
      const price = parsePositiveNumber(item.price);
      ctx.fillStyle = "#17211d";
      const nextY = drawWrappedText(ctx, item.name, 105, y, 475, 30);
      ctx.fillText(quantity.toString(), 660, y);
      ctx.fillText(formatMoney(price, currency), 790, y);
      ctx.fillText(formatMoney(itemTotal(item), currency), 980, y);
      y = Math.max(nextY, y + 44);
      ctx.strokeStyle = "#eef2ef";
      ctx.beginPath();
      ctx.moveTo(80, y - 18);
      ctx.lineTo(1160, y - 18);
      ctx.stroke();
    });

    y += 42;
    ctx.font = "700 32px Arial";
    ctx.fillText("Ümumi", 790, y);
    ctx.fillText(formatMoney(subtotal, currency), 980, y);

    if (note.trim()) {
      y += 86;
      ctx.font = "700 24px Arial";
      ctx.fillText("Qeyd", 80, y);
      ctx.font = "400 23px Arial";
      drawWrappedText(ctx, note, 80, y + 40, 1000, 32);
    }

    ctx.font = "400 20px Arial";
    ctx.fillStyle = "#63716b";
    ctx.fillText("Bu sənəd AzToolbox ilə brauzerdə yaradılıb.", 80, 1660);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const image = canvas.toDataURL("image/png");
    pdf.addImage(image, "PNG", 0, 0, 595.28, 841.89);
    pdf.save("aztoolbox-invoice.pdf");
    setStatus("PDF hazırlandı və yükləmə başladı.");
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Satıcı adı
            </label>
            <input
              value={seller}
              onChange={(event) => {
                setSeller(event.target.value);
                setStatus("");
              }}
              placeholder="Məsələn: Az Studio"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Müştəri adı
            </label>
            <input
              value={customer}
              onChange={(event) => {
                setCustomer(event.target.value);
                setStatus("");
              }}
              placeholder="Müştəri və ya şirkət adı"
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Valyuta</label>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            >
              <option value="AZN">AZN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Tarix</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="font-semibold">Xidmətlər / məhsullar</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-semibold transition hover:border-accent"
            >
              <Plus size={15} />
              Yeni məhsul/xidmət əlavə et
            </button>
          </div>
          <div className="grid gap-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-md border border-line bg-surface-soft p-3 lg:grid-cols-[1fr_110px_140px_40px]"
              >
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Xidmət / məhsul adı
                  </label>
                  <input
                    value={item.name}
                    onChange={(event) =>
                      updateItem(item.id, { name: event.target.value })
                    }
                    placeholder={`Sətir ${index + 1}`}
                    className="h-10 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Miqdar
                  </label>
                  <input
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) =>
                      updateNumberItem(item.id, "quantity", event.target.value)
                    }
                    placeholder="1"
                    className="h-10 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Qiymət
                  </label>
                  <input
                    inputMode="decimal"
                    value={item.price}
                    onChange={(event) =>
                      updateNumberItem(item.id, "price", event.target.value)
                    }
                    placeholder="0.00"
                    className="h-10 w-full rounded-md border border-line bg-white px-3 outline-none transition focus:border-accent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  title="Sətiri sil"
                  aria-label="Sətiri sil"
                  className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-danger hover:text-danger disabled:opacity-40 lg:mt-5"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold">Qeyd</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Əlavə qeyd və ya ödəniş məlumatı..."
            className="w-full resize-y rounded-md border border-line bg-white p-3 leading-7 outline-none transition focus:border-accent"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            <Download size={16} />
            PDF yüklə
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold transition hover:border-accent"
          >
            <RotateCcw size={16} />
            Formanı təmizlə
          </button>
        </div>
        {status ? (
          <p
            className={`mt-3 text-sm ${status.includes("hazırlandı") ? "text-accent-strong" : "text-danger"}`}
          >
            {status}
          </p>
        ) : null}
        <p className="mt-4 text-sm leading-6 text-muted">
          Bu sadə qəbz/invoice generatorudur. Rəsmi mühasibat sənədi kimi
          istifadə etməzdən əvvəl tələbləri yoxlayın.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="rounded-lg border border-line bg-white p-6">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-strong">
                AzToolbox
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Qəbz / Invoice</h2>
            </div>
            <div className="text-sm text-muted sm:text-right">
              <p>{invoiceNumber}</p>
              <p>{date}</p>
            </div>
          </div>

          <div className="grid gap-5 border-b border-line py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Satıcı
              </p>
              <p className="mt-2 min-h-6 font-medium">
                {seller || "Satıcı adı"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Müştəri
              </p>
              <p className="mt-2 min-h-6 font-medium">
                {customer || "Müştəri adı"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto py-5">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 font-semibold">Xidmət / məhsul</th>
                  <th className="py-2 font-semibold">Miqdar</th>
                  <th className="py-2 font-semibold">Qiymət</th>
                  <th className="py-2 text-right font-semibold">Cəmi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const quantity = parsePositiveNumber(item.quantity);
                  const price = parsePositiveNumber(item.price);

                  return (
                    <tr key={item.id} className="border-b border-line">
                      <td className="py-3">
                        {item.name || "Xidmət / məhsul adı"}
                      </td>
                      <td className="py-3">{item.quantity || "0"}</td>
                      <td className="py-3">{formatMoney(price, currency)}</td>
                      <td className="py-3 text-right">
                        {formatMoney(quantity * price, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ml-auto w-full max-w-xs border-t border-line pt-4">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
          </div>

          {note.trim() ? (
            <div className="mt-6 rounded-md bg-surface-soft p-4 text-sm leading-6">
              <p className="mb-1 font-semibold">Qeyd</p>
              <p className="text-muted">{note}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
