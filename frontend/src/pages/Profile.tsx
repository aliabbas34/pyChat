import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { unfriend } from "../api/friends";
import { getProfile } from "../api/users";
import OnlineDot from "../components/OnlineDot";
import PageCard from "../components/PageCard";
import RelationshipButton from "../components/RelationshipButton";
import { useSocketEvent } from "../context/SocketContext";
import type { Profile as ProfileData, User } from "../types";

export default function Profile() {
  const { username = "" } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getProfile(username)
      .then(setProfile)
      .catch((err: Error) => setError(err.message));
  }, [username]);

  useEffect(load, [load]);

  // Reload when this user changes our relationship from their side.
  const reloadIfThisUser = ({ user }: { user: User }) => {
    if (user.username === username) load();
  };
  useSocketEvent("friend_request.new", reloadIfThisUser);
  useSocketEvent("friend_request.accepted", reloadIfThisUser);
  useSocketEvent("friend_request.rejected", reloadIfThisUser);
  useSocketEvent("friend_request.cancelled", reloadIfThisUser);
  useSocketEvent("friend.removed", reloadIfThisUser);
  useSocketEvent("presence", ({ username: who, online }) => {
    if (who === username) setProfile((current) => current && { ...current, is_online: online });
  });

  const handleUnfriend = async () => {
    if (!window.confirm(`Remove ${username} from friends?`)) return;
    await unfriend(username);
    load();
  };

  if (error) return <PageCard title="Profile"><p className="error">{error}</p></PageCard>;
  if (!profile) return <PageCard title="Profile"><p className="text-slate-500">Loading…</p></PageCard>;

  return (
    <PageCard title="Profile">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">{profile.display_name}</h2>
        <OnlineDot online={profile.is_online} />
      </div>
      <p className="text-slate-500">@{profile.username}</p>
      <p className="mt-4 whitespace-pre-wrap text-slate-700">
        {profile.bio || <span className="text-slate-400">No bio.</span>}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <RelationshipButton
          username={profile.username}
          relationship={profile.relationship}
          onChange={(relationship) => setProfile({ ...profile, relationship })}
        />
        {profile.relationship === "friends" && (
          <button onClick={handleUnfriend} className="btn-danger">Unfriend</button>
        )}
      </div>
    </PageCard>
  );
}
