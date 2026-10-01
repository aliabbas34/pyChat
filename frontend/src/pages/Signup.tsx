import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { SignupData } from "../api/auth";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState<SignupData>({ username: "", display_name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const update = (event: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await signup(form);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthCard title="Create an account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="input" name="username" placeholder="Username" value={form.username} onChange={update} required />
        <input className="input" name="display_name" placeholder="Display name" value={form.display_name} onChange={update} required />
        <input className="input" name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
        <input className="input" name="password" type="password" placeholder="Password" value={form.password} onChange={update} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">Sign up</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Have an account?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">Log in</Link>
      </p>
    </AuthCard>
  );
}
