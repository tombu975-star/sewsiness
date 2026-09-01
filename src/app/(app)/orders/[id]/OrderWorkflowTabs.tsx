"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { advanceStage } from "../../production/actions";
import { scheduleFitting, updateFittingOutcome } from "../../fittings/actions";
import { requestAlteration, updateAlterationStatus } from "../../alterations/actions";
import { submitQualityCheck } from "../../quality-control/actions";
import { saveOrderCost } from "../../costing/actions";

const STAGES = ["Cutting", "Sewing", "Finishing", "Pressing", "Ready"];

export function ProductionTab({ orderId, stages }: { orderId: string; stages: { stage: string; status: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function setStage(stage: string, status: string) {
    const fd = new FormData();
    fd.set("order_id", orderId);
    fd.set("stage", stage);
    fd.set("status", status);
    startTransition(async () => {
      await advanceStage(fd);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <div className="font-display font-semibold text-ink mb-4">Production Stages</div>
      <div className="space-y-2.5">
        {STAGES.map((stage) => {
          const found = stages.find((s) => s.stage === stage);
          const status = found?.status ?? "Pending";
          return (
            <div key={stage} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink font-medium">{stage}</span>
              <select
                value={status}
                disabled={isPending}
                onChange={(e) => setStage(stage, e.target.value)}
                className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-gold disabled:opacity-60"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FittingsTab({
  orderId,
  fittings,
}: {
  orderId: string;
  fittings: { id: string; scheduled_at: string | null; outcome: string; notes: string | null }[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function setOutcome(id: string, outcome: string) {
    startTransition(async () => {
      await updateFittingOutcome(id, orderId, outcome);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          fd.set("order_id", orderId);
          await scheduleFitting(fd);
          router.refresh();
        }}
        className="card p-4 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Date & time</label>
          <input name="scheduled_at" type="datetime-local" className="rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-ink-muted mb-1">Notes</label>
          <input name="notes" placeholder="Optional" className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold" />
        </div>
        <SubmitButton pendingLabel="Scheduling…">Schedule Fitting</SubmitButton>
      </form>

      <div className="card divide-y divide-border">
        {fittings.length === 0 && <div className="p-6 text-center text-sm text-ink-muted">No fittings scheduled yet.</div>}
        {fittings.map((f) => (
          <div key={f.id} className="p-3.5 flex items-center justify-between gap-3">
            <div className="text-sm text-ink">{f.scheduled_at ? new Date(f.scheduled_at).toLocaleString() : "Unscheduled"}</div>
            <select
              value={f.outcome}
              disabled={isPending}
              onChange={(e) => setOutcome(f.id, e.target.value)}
              className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-gold disabled:opacity-60"
            >
              <option>Pending</option>
              <option>Approved</option>
              <option>Needs Alteration</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlterationsTab({
  orderId,
  alterations,
}: {
  orderId: string;
  alterations: { id: string; description: string; status: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      await updateAlterationStatus(id, orderId, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          fd.set("order_id", orderId);
          await requestAlteration(fd);
          router.refresh();
        }}
        className="card p-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-semibold text-ink-muted mb-1">Alteration needed</label>
          <input name="description" required placeholder="e.g. Take in the waist by 1 inch" className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold" />
        </div>
        <SubmitButton pendingLabel="Requesting…">Request</SubmitButton>
      </form>

      <div className="card divide-y divide-border">
        {alterations.length === 0 && <div className="p-6 text-center text-sm text-ink-muted">No alterations requested yet.</div>}
        {alterations.map((a) => (
          <div key={a.id} className="p-3.5 flex items-center justify-between gap-3">
            <div className="text-sm text-ink">{a.description}</div>
            <select
              value={a.status}
              disabled={isPending}
              onChange={(e) => setStatus(a.id, e.target.value)}
              className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-gold disabled:opacity-60"
            >
              <option>Requested</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QualityControlTab({
  orderId,
  checks,
}: {
  orderId: string;
  checks: { id: string; seams_ok: boolean; fit_ok: boolean; finishing_ok: boolean; passed: boolean; created_at: string }[];
}) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          fd.set("order_id", orderId);
          await submitQualityCheck(fd);
          router.refresh();
        }}
        className="card p-4 space-y-3"
      >
        <div className="font-semibold text-sm text-ink">Run a check</div>
        <div className="flex flex-wrap gap-4 text-sm text-ink">
          <label className="flex items-center gap-1.5"><input type="checkbox" name="seams_ok" /> Seams OK</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" name="fit_ok" /> Fit OK</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" name="finishing_ok" /> Finishing OK</label>
        </div>
        <input name="notes" placeholder="Notes (optional)" className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold" />
        <SubmitButton pendingLabel="Submitting…">Submit Check</SubmitButton>
      </form>

      <div className="card divide-y divide-border">
        {checks.length === 0 && <div className="p-6 text-center text-sm text-ink-muted">No QC checks run yet.</div>}
        {checks.map((c) => (
          <div key={c.id} className="p-3.5 flex items-center justify-between gap-3">
            <div className="text-xs text-ink-muted">{new Date(c.created_at).toLocaleString()}</div>
            <StatusBadge value={c.passed ? "Passed" : "Failed"} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CostingTab({
  orderId,
  cost,
  revenue,
  restricted,
}: {
  orderId: string;
  cost: { fabric_cost: number; labor_cost: number; overhead_cost: number; other_cost: number } | null;
  revenue: number;
  restricted: boolean;
}) {
  const router = useRouter();

  if (restricted) {
    return <div className="card p-10 text-center text-sm text-ink-muted">Costing is restricted to Owner, Manager and Super Admin.</div>;
  }

  const total = (cost?.fabric_cost ?? 0) + (cost?.labor_cost ?? 0) + (cost?.overhead_cost ?? 0) + (cost?.other_cost ?? 0);

  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          fd.set("order_id", orderId);
          await saveOrderCost(fd);
          router.refresh();
        }}
        className="card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <NumField label="Fabric (₵)" name="fabric_cost" defaultValue={cost?.fabric_cost} />
        <NumField label="Labor (₵)" name="labor_cost" defaultValue={cost?.labor_cost} />
        <NumField label="Overhead (₵)" name="overhead_cost" defaultValue={cost?.overhead_cost} />
        <NumField label="Other (₵)" name="other_cost" defaultValue={cost?.other_cost} />
        <div className="col-span-2 sm:col-span-4 flex items-center justify-between pt-2">
          <div className="text-sm">
            <span className="text-ink-muted">Margin: </span>
            <span className="font-semibold text-indigo">₵{(revenue - total).toFixed(2)}</span>
          </div>
          <SubmitButton pendingLabel="Saving…">Save Costing</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function NumField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label}</label>
      <input
        name={name}
        type="number"
        step="0.01"
        min="0"
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold"
      />
    </div>
  );
}
