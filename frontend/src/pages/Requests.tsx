import { useCallback, useEffect, useState } from "react";
import { acceptRequest, cancelRequest, getRequests, rejectRequest } from "../api/friends";
import PageCard from "../components/PageCard";
import UserRow from "../components/UserRow";
import { useSocketEvent } from "../context/SocketContext";
import type { FriendRequests } from "../types";

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{children}</h2>;
}

function Empty({ children }: { children: string }) {
  return <p className="py-3 text-sm text-slate-400">{children}</p>;
}

export default function Requests() {
  const [requests, setRequests] = useState<FriendRequests | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getRequests().then(setRequests);
  }, []);

  useEffect(load, [load]);
  useSocketEvent("friend_request.new", load);
  useSocketEvent("friend_request.accepted", load);
  useSocketEvent("friend_request.rejected", load);
  useSocketEvent("friend_request.cancelled", load);

  const act = (action: (username: string) => Promise<null>, username: string) => async () => {
    setError("");
    try {
      await action(username);
    } catch (err) {
      setError((err as Error).message);
    }
    load();
  };

  if (!requests) return <PageCard title="Requests"><p className="text-slate-500">Loading…</p></PageCard>;

  return (
    <PageCard title="Requests">
      {error && <p className="error mb-4">{error}</p>}

      <SectionTitle>Incoming</SectionTitle>
      {requests.incoming.length === 0 && <Empty>No incoming requests.</Empty>}
      <ul className="mb-6 divide-y divide-slate-100">
        {requests.incoming.map((user) => (
          <UserRow key={user.id} user={user}>
            <button onClick={act(acceptRequest, user.username)} className="btn-primary">Accept</button>
            <button onClick={act(rejectRequest, user.username)} className="btn-secondary">Reject</button>
          </UserRow>
        ))}
      </ul>

      <SectionTitle>Sent</SectionTitle>
      {requests.outgoing.length === 0 && <Empty>No sent requests.</Empty>}
      <ul className="divide-y divide-slate-100">
        {requests.outgoing.map((user) => (
          <UserRow key={user.id} user={user}>
            <button onClick={act(cancelRequest, user.username)} className="btn-secondary">Cancel</button>
          </UserRow>
        ))}
      </ul>
    </PageCard>
  );
}
