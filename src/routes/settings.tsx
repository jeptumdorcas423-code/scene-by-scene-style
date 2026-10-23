import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, Shield, Info } from "lucide-react";
import { actions, localDateKey, useAppState } from "@/lib/store";
import { Callout, PageHeader } from "@/components/kit";
import { DISCLAIMER } from "@/components/AppShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/settings")({
  head: () => pageHead("Settings & About", "Study goals, privacy information and progress reset for Azure Buddy."),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useAppState();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <PageHeader title="Settings & About" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface space-y-4 p-5">
          <h2 className="font-bold">Study settings</h2>
          <label className="block text-sm"><span className="mb-1 block font-medium">Daily study goal (minutes)</span>
            <input type="number" min={5} max={480} className="field" value={s.settings.dailyGoal} onChange={(e) => actions.updateSettings({ dailyGoal: Math.max(5, Number(e.target.value) || 5) })} />
          </label>
          <label className="block text-sm"><span className="mb-1 block font-medium">Target study date</span>
            <input type="date" className="field" min={localDateKey()} value={s.settings.targetDate} onChange={(e) => actions.updateSettings({ targetDate: e.target.value })} />
          </label>
        </section>

        <section className="surface space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-bold"><Shield className="h-4 w-4 text-teal" /> Privacy & data storage</h2>
          <p className="text-sm text-muted-foreground">Your progress is saved only in this browser on this device. No account, no personal information and no external services are used. Progress won't transfer automatically to other devices or browsers, and clearing your browser data will remove it.</p>
          {done && <Callout tone="teal">Your Azure Buddy progress has been reset.</Callout>}
          {!confirming ? (
            <button className="btn btn-danger" onClick={() => { setConfirming(true); setDone(false); }}><RotateCcw className="h-4 w-4" /> Reset My Progress</button>
          ) : (
            <div className="rounded-lg border border-error-ink/30 bg-error-soft p-4 text-sm text-error-ink" role="alertdialog" aria-label="Confirm reset">
              <p className="font-semibold">Reset all Azure Buddy progress?</p>
              <p className="mt-1">This deletes quiz history, mistakes, flashcard status, tasks and goals. Other website data isn't affected. This can't be undone.</p>
              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary" onClick={() => { actions.reset(); setConfirming(false); setDone(true); }}>Yes, reset</button>
                <button className="btn btn-outline" onClick={() => setConfirming(false)}>Cancel</button>
              </div>
            </div>
          )}
        </section>

        <section className="surface space-y-3 p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-bold"><Info className="h-4 w-4 text-primary" /> About Azure Buddy</h2>
          <p className="text-sm text-muted-foreground">Azure Buddy is an educational tool for university students and beginners preparing for the Microsoft Azure Fundamentals (AZ-900) certification. It includes lessons, original practice questions, flashcards, mistake review, a study planner and a readiness tracker—all working offline in your browser.</p>
          <Callout>{DISCLAIMER}</Callout>
        </section>
      </div>
    </>
  );
}
