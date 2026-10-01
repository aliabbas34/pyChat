import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthCard title="Log in">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">Log in</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        No account?{" "}
        <Link to="/signup" className="font-medium text-indigo-600 hover:underline">Sign up</Link>
      </p>
    </AuthCard>
  );
}
