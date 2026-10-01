import { useState, type FormEvent } from "react";
import { searchUsers } from "../api/users";
import PageCard from "../components/PageCard";
import RelationshipButton from "../components/RelationshipButton";
import UserRow from "../components/UserRow";
import type { Profile, Relationship } from "../types";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[] | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResults(await searchUsers(query));
  };

  const setRelationship = (username: string, relationship: Relationship) =>
    setResults((current) =>
      current?.map((user) => (user.username === username ? { ...user, relationship } : user)) ?? null,
    );

  return (
    <PageCard title="Add friend">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input className="input" placeholder="Name or username" value={query} onChange={(e) => setQuery(e.target.value)} required />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {results?.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">No users found.</p>}
      <ul className="mt-2 divide-y divide-slate-100">
        {results?.map((user) => (
          <UserRow key={user.id} user={user}>
            <RelationshipButton
              username={user.username}
              relationship={user.relationship}
              onChange={(relationship) => setRelationship(user.username, relationship)}
            />
          </UserRow>
        ))}
      </ul>
    </PageCard>
  );
}
