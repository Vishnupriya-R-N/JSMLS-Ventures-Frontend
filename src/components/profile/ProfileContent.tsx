"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { isIndianMobile } from "@/lib/validators";
import { getProfile, updateProfile } from "@/services/profile";
import type { ProfileData } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ready"; data: ProfileData }
  | { status: "error"; message: string; unauthorized: boolean };

type Errors = Partial<Record<"fullName" | "mobile", string>>;

const clean = (m: string) => m.replace(/[\s-]/g, "");

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 break-words font-semibold text-navy-900">{value || "—"}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading your profile…</span>
      <div className="mb-6 h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-56 animate-pulse rounded-xl border border-line bg-white" />
    </div>
  );
}

export default function ProfileContent() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile().then((res) => {
      if (cancelled) return;
      setState(
        res.ok
          ? { status: "ready", data: res.data }
          : { status: "error", message: res.message, unauthorized: !!res.unauthorized },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

  if (state.status === "loading") return <LoadingSkeleton />;

  if (state.status === "error") {
    return (
      <div className="grid gap-4">
        <h1 className="text-[1.6rem] font-bold leading-tight text-navy-900">Profile</h1>
        <Alert tone="error">{state.message}</Alert>
        {state.unauthorized ? (
          <div>
            <Link
              href="/login"
              className="inline-block rounded-[10px] border border-navy-700 bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-600"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <div>
            <Button type="button" onClick={retry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  const data = state.data;
  const changed = fullName.trim() !== data.fullName || clean(mobile) !== clean(data.mobile);

  function startEdit() {
    setFullName(data.fullName);
    setMobile(data.mobile);
    setErrors({});
    setSaveError(null);
    setSaved(null);
    setEditing(true);
  }

  function cancelEdit() {
    setErrors({});
    setSaveError(null);
    setEditing(false);
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing || saving) return;
    setSaveError(null);
    setSaved(null);

    const e: Errors = {};
    if (fullName.trim().length < 3) e.fullName = "Enter your full name.";
    if (!isIndianMobile(mobile)) e.mobile = "Enter a valid 10-digit mobile number.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const res = await updateProfile({ fullName: fullName.trim(), mobile: clean(mobile) });
    setSaving(false);

    if (res.ok) {
      setState({
        status: "ready",
        data: res.data ?? { ...data, fullName: fullName.trim(), mobile: clean(mobile) },
      });
      setEditing(false);
      setSaved(res.message);
    } else if (res.unauthorized) {
      setState({ status: "error", message: res.message, unauthorized: true });
    } else {
      setSaveError(res.message);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[1.6rem] font-bold leading-tight text-navy-900">Profile</h1>
        <p className="text-muted">Your personal information.</p>
      </div>

      {saved && (
        <div className="mb-4">
          <Alert tone="success">{saved}</Alert>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-xl border border-line bg-white p-5 shadow-lg shadow-navy-900/10 sm:p-6"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy-900">Personal information</h2>
          {!editing && (
            <Button type="button" variant="outline" onClick={startEdit}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid items-start gap-5 sm:grid-cols-2">
          {editing ? (
            <Input
              label="Full name"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />
          ) : (
            <Row label="Full name" value={data.fullName} />
          )}
          <Row label="User ID" value={data.userId} />
          <Row label="Email" value={data.email} />
          {editing ? (
            <Input
              label="Mobile number"
              name="mobile"
              type="tel"
              autoComplete="tel"
              placeholder="10-digit number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              error={errors.mobile}
            />
          ) : (
            <Row label="Mobile number" value={data.mobile} />
          )}
        </div>

        {editing && (
          <>
            {saveError && (
              <div className="mt-4">
                <Alert tone="error">{saveError}</Alert>
              </div>
            )}
            <p className="mt-4 text-sm text-muted">User ID and email cannot be changed here.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="submit" disabled={saving || !changed}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </form>
    </>
  );
}