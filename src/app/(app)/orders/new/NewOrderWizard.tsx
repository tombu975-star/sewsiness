"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { createOrder } from "../actions";

type Customer = { id: string; full_name: string };
type MeasurementSet = {
  id: string;
  customer_id: string;
  label: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  shoulder: number | null;
  sleeve_length: number | null;
  garment_length: number | null;
  created_at: string;
};

const STEPS = ["Customer", "Measurements", "Order details", "Payment & review"];

const MEASUREMENT_FIELDS: { key: keyof MeasurementSet & string; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeve_length", label: "Sleeve length" },
  { key: "garment_length", label: "Garment length" },
];

export function NewOrderWizard({
  customers,
  measurements,
  defaultCustomer,
}: {
  customers: Customer[];
  measurements: MeasurementSet[];
  defaultCustomer?: string;
}) {
  const [step, setStep] = useState(0);
  const [customerId, setCustomerId] = useState(defaultCustomer ?? "");
  const [garment, setGarment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [total, setTotal] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [method, setMethod] = useState("Cash");
  const [error, setError] = useState("");

  // "existing" (pick a saved set), "new" (measure now), or "skip" (do it
  // later) — mirrors the three ways the brief calls for handling this
  // step, since forcing a measurement on every order is exactly the kind
  // of friction a novice-facing wizard shouldn't add when it isn't ready.
  const [measurementMode, setMeasurementMode] = useState<"existing" | "new" | "skip">("skip");
  const [existingMeasurementId, setExistingMeasurementId] = useState("");
  const [measurementLabel, setMeasurementLabel] = useState("Standard");
  const [mChest, setMChest] = useState("");
  const [mWaist, setMWaist] = useState("");
  const [mHips, setMHips] = useState("");
  const [mShoulder, setMShoulder] = useState("");
  const [mSleeve, setMSleeve] = useState("");
  const [mGarmentLen, setMGarmentLen] = useState("");
  const [mNotes, setMNotes] = useState("");

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerMeasurements = useMemo(
    () => measurements.filter((m) => m.customer_id === customerId),
    [measurements, customerId]
  );
  const totalNumber = Number(total || 0);
  const paymentNumber = Number(initialPayment || 0);
  const balance = Math.max(0, totalNumber - paymentNumber);

  // Whenever the customer changes, default the measurements step to
  // whatever makes sense for *this* customer rather than carrying over
  // a stale mode/selection from whoever was picked before.
  function selectCustomer(id: string) {
    setCustomerId(id);
    const forThisCustomer = measurements.filter((m) => m.customer_id === id);
    setExistingMeasurementId(forThisCustomer[0]?.id ?? "");
    setMeasurementMode(forThisCustomer.length > 0 ? "existing" : "skip");
  }

  function next() {
    setError("");
    if (step === 0 && !customerId) return setError("Please select a customer to continue.");
    if (step === 1 && measurementMode === "existing" && !existingMeasurementId) {
      return setError("Please choose a measurement set, or switch to \u201cTake new\u201d / \u201cSkip for now.\u201d");
    }
    if (step === 2) {
      if (!garment.trim()) return setError("Please enter the garment or item being ordered.");
      if (totalNumber < 0) return setError("Order total cannot be negative.");
    }
    if (step === 3 && paymentNumber > totalNumber) return setError("Initial payment cannot be more than the order total.");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <form action={createOrder} className="max-w-2xl space-y-5">
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="garment" value={garment} />
      <input type="hidden" name="due_date" value={dueDate} />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="total_amount" value={total} />
      <input type="hidden" name="initial_payment" value={initialPayment} />
      <input type="hidden" name="payment_method" value={method} />
      <input type="hidden" name="payment_type" value={paymentNumber >= totalNumber && totalNumber > 0 ? "Full" : "Deposit"} />

      <input type="hidden" name="measurement_mode" value={measurementMode} />
      {measurementMode === "new" && (
        <>
          <input type="hidden" name="measurement_label" value={measurementLabel} />
          <input type="hidden" name="measurement_chest" value={mChest} />
          <input type="hidden" name="measurement_waist" value={mWaist} />
          <input type="hidden" name="measurement_hips" value={mHips} />
          <input type="hidden" name="measurement_shoulder" value={mShoulder} />
          <input type="hidden" name="measurement_sleeve_length" value={mSleeve} />
          <input type="hidden" name="measurement_garment_length" value={mGarmentLen} />
          <input type="hidden" name="measurement_notes" value={mNotes} />
        </>
      )}

      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${index <= step ? "bg-indigo text-white" : "bg-sunken text-ink-muted"}`}>
                {index < step ? "✓" : index + 1}
              </div>
              <span className={`hidden sm:block text-xs font-semibold ${index === step ? "text-ink" : "text-ink-muted"}`}>{label}</span>
              {index < STEPS.length - 1 && <div className={`h-px flex-1 ${index < step ? "bg-indigo" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="callout text-sm" role="alert">{error}</div>}

      {step === 0 && (
        <section className="card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Who is this order for?</h2>
            <p className="text-sm text-ink-muted mt-1">Choose an existing customer or add them first.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Customer</label>
            <select value={customerId} onChange={(e) => selectCustomer(e.target.value)} className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/20">
              <option value="">Select a customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <Link href="/customers/new" className="inline-flex items-center justify-center w-full h-11 rounded-lg border border-border bg-surface text-sm font-semibold text-ink hover:bg-sunken transition-colors">
            + Add New Customer
          </Link>
          {selectedCustomer && <div className="rounded-lg bg-indigo-soft p-4 text-sm"><div className="font-semibold text-ink">Selected customer</div><div className="text-ink-muted mt-1">{selectedCustomer.full_name}</div></div>}
          <div className="flex justify-end pt-1"><button type="button" onClick={next} className="h-11 px-5 rounded-lg bg-indigo text-white text-sm font-semibold hover:opacity-90">Continue →</button></div>
        </section>
      )}

      {step === 1 && (
        <section className="card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Measurements</h2>
            <p className="text-sm text-ink-muted mt-1">
              {selectedCustomer?.full_name ?? "This customer"}'s measurement profile — use what's on file, take new ones, or skip for now.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(customerMeasurements.length > 0
              ? (["existing", "new", "skip"] as const)
              : (["new", "skip"] as const)
            ).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMeasurementMode(mode)}
                className={`h-11 rounded-lg border text-sm font-semibold transition-colors ${
                  measurementMode === mode ? "border-gold bg-gold-soft text-gold-ink" : "border-border bg-surface text-ink hover:bg-sunken"
                }`}
              >
                {mode === "existing" ? "Use existing" : mode === "new" ? "Take new" : "Skip for now"}
              </button>
            ))}
          </div>

          {measurementMode === "existing" && (
            <div className="space-y-2">
              {customerMeasurements.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors ${
                    existingMeasurementId === m.id ? "border-gold bg-gold-soft/40" : "border-border bg-surface hover:bg-sunken"
                  }`}
                >
                  <input
                    type="radio"
                    name="_existing_measurement_picker"
                    checked={existingMeasurementId === m.id}
                    onChange={() => setExistingMeasurementId(m.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{m.label}</span>
                      <span className="text-[11px] text-ink-faint">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      {MEASUREMENT_FIELDS.filter((f) => m[f.key] != null)
                        .map((f) => `${f.label} ${m[f.key]}"`)
                        .join(" · ") || "No values recorded"}
                    </div>
                  </div>
                </label>
              ))}
              <input type="hidden" name="existing_measurement_id" value={existingMeasurementId} />
            </div>
          )}

          {measurementMode === "new" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Set label</label>
                <input
                  value={measurementLabel}
                  onChange={(e) => setMeasurementLabel(e.target.value)}
                  placeholder="e.g. Wedding outfit"
                  className="w-full sm:w-64 h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-gold"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <NumField label="Chest" value={mChest} onChange={setMChest} />
                <NumField label="Waist" value={mWaist} onChange={setMWaist} />
                <NumField label="Hips" value={mHips} onChange={setMHips} />
                <NumField label="Shoulder" value={mShoulder} onChange={setMShoulder} />
                <NumField label="Sleeve length" value={mSleeve} onChange={setMSleeve} />
                <NumField label="Garment length" value={mGarmentLen} onChange={setMGarmentLen} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Notes</label>
                <textarea
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </div>
              <p className="text-xs text-ink-faint">This will be saved to {selectedCustomer?.full_name ?? "the customer"}'s profile for next time too.</p>
            </div>
          )}

          {measurementMode === "skip" && (
            <p className="text-sm text-ink-muted">
              No problem — you can record measurements any time from{" "}
              <Link href="/measurements/new" className="text-indigo font-semibold hover:underline">
                Measurements
              </Link>
              .
            </p>
          )}

          <div className="flex justify-between gap-2 pt-1">
            <button type="button" onClick={back} className="h-11 px-4 rounded-lg border border-border text-sm font-semibold text-ink">← Back</button>
            <button type="button" onClick={next} className="h-11 px-5 rounded-lg bg-indigo text-white text-sm font-semibold hover:opacity-90">Continue →</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card p-5 sm:p-6 space-y-5">
          <div><h2 className="font-display text-xl font-semibold text-ink">What is being ordered?</h2><p className="text-sm text-ink-muted mt-1">Keep the details simple. You can add more information later.</p></div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Garment / Item</label>
            <input value={garment} onChange={(e) => setGarment(e.target.value)} placeholder="e.g. Kaba & Slit" className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-gold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-ink mb-2">Delivery date</label><input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-gold" /></div>
            <div><label className="block text-sm font-semibold text-ink mb-2">Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-gold"><option>Normal</option><option>Low</option><option>High</option></select></div>
          </div>
          <div><label className="block text-sm font-semibold text-ink mb-2">Order total (₵)</label><input value={total} onChange={(e) => setTotal(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00" className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-gold" /></div>
          <div className="flex justify-between gap-2 pt-1"><button type="button" onClick={back} className="h-11 px-4 rounded-lg border border-border text-sm font-semibold text-ink">← Back</button><button type="button" onClick={next} className="h-11 px-5 rounded-lg bg-indigo text-white text-sm font-semibold">Continue →</button></div>
        </section>
      )}

      {step === 3 && (
        <section className="card p-5 sm:p-6 space-y-5">
          <div><h2 className="font-display text-xl font-semibold text-ink">Payment & review</h2><p className="text-sm text-ink-muted mt-1">Record an optional deposit now. The balance is calculated automatically.</p></div>
          <div className="rounded-xl bg-sunken p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">Customer</span><strong>{selectedCustomer?.full_name ?? "—"}</strong></div>
            <div className="flex justify-between"><span className="text-ink-muted">Order</span><strong>{garment || "—"}</strong></div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Measurements</span>
              <strong>
                {measurementMode === "existing"
                  ? customerMeasurements.find((m) => m.id === existingMeasurementId)?.label ?? "Selected set"
                  : measurementMode === "new"
                    ? `New — ${measurementLabel}`
                    : "Not recorded yet"}
              </strong>
            </div>
            <div className="flex justify-between"><span className="text-ink-muted">Total</span><strong>₵{totalNumber.toFixed(2)}</strong></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-ink mb-2">Amount paid now (₵)</label><input value={initialPayment} onChange={(e) => setInitialPayment(e.target.value)} type="number" step="0.01" min="0" max={totalNumber} placeholder="0.00" className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-gold" /></div>
            <div><label className="block text-sm font-semibold text-ink mb-2">Payment method</label><select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-gold"><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-border p-4"><div className="text-xs text-ink-muted">Paid</div><div className="text-lg font-bold text-ink mt-1">₵{paymentNumber.toFixed(2)}</div></div><div className="rounded-lg border border-border p-4"><div className="text-xs text-ink-muted">Balance</div><div className="text-lg font-bold text-ink mt-1">₵{balance.toFixed(2)}</div></div></div>
          <div className="flex justify-between gap-2 pt-1"><button type="button" onClick={back} className="h-11 px-4 rounded-lg border border-border text-sm font-semibold text-ink">← Back</button><SubmitButton pendingLabel="Creating order…">Create Order</SubmitButton></div>
        </section>
      )}
    </form>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label} (in)</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="number"
        step="0.25"
        min="0"
        className="w-full h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-gold"
      />
    </div>
  );
}
