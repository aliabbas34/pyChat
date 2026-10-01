import { useState, type ChangeEvent, type FormEvent } from "react";
import { changePassword, updateMe } from "../api/users";
import PageCard from "../components/PageCard";
import { useAuth } from "../context/AuthContext";
import type { Me } from "../types";

interface Status {
  ok: boolean;
  text: string;
}

function StatusText({ status }: { status: Status | null }) {
  if (!status) return null;
  return <p className={status.ok ? "text-sm text-emerald-600" : "error"}>{status.text}</p>;
}

function ProfileForm({ me, onSaved }: { me: Me; onSaved: (me: Me) => void }) {
  const [form, setForm] = useState({
    username: me.username,
    display_name: me.display_name,
    email: me.email,
    bio: me.bio,
  });
  const [status, setStatus] = useState<Status | null>(null);

  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      onSaved(await updateMe(form));
      setStatus({ ok: true, text: "Saved." });
    } catch (err) {
      setStatus({ ok: false, text: (err as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-semibold text-slate-900">Profile</h2>
      <label className="label">Username <input className="input" name="username" value={form.username} onChange={update} required /></label>
      <label className="label">Display name <input className="input" name="display_name" value={form.display_name} onChange={update} required /></label>
      <label className="label">Email <input className="input" name="email" type="email" value={form.email} onChange={update} required /></label>
      <label className="label">Bio <textarea className="input" name="bio" rows={3} value={form.bio} onChange={update} maxLength={500} /></label>
      <StatusText status={status} />
      <button type="submit" className="btn-primary self-start">Save profile</button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<Status | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setStatus({ ok: true, text: "Password changed." });
    } catch (err) {
      setStatus({ ok: false, text: (err as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-semibold text-slate-900">Password</h2>
      <label className="label">
        Current password
        <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      </label>
      <label className="label">
        New password
        <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      </label>
      <StatusText status={status} />
      <button type="submit" className="btn-primary self-start">Change password</button>
    </form>
  );
}

export default function Settings() {
  const { me, setMe } = useAuth();
  if (!me) return null;

  return (
    <PageCard title="Settings">
      <ProfileForm me={me} onSaved={setMe} />
      <hr className="my-6 border-slate-200" />
      <PasswordForm />
    </PageCard>
  );
}
