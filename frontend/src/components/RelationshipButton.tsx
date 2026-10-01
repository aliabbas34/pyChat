import { useState } from "react";
import { Link } from "react-router-dom";
import { acceptRequest, cancelRequest, sendRequest } from "../api/friends";
import type { Relationship } from "../types";

interface Props {
  username: string;
  relationship: Relationship;
  onChange: (relationship: Relationship) => void;
}

// What clicking the button does in each state, and the state it leads to.
const ACTIONS = {
  none: { label: "Add friend", run: sendRequest, next: "sent", style: "btn-primary" },
  sent: { label: "Cancel request", run: cancelRequest, next: "none", style: "btn-secondary" },
  received: { label: "Accept", run: acceptRequest, next: "friends", style: "btn-primary" },
} as const;

/** The single action available for a user, based on how they relate to me. */
export default function RelationshipButton({ username, relationship, onChange }: Props) {
  const [error, setError] = useState("");

  if (relationship === "self") return <Link to="/settings" className="btn-secondary">Edit profile</Link>;
  if (relationship === "friends") return <Link to={`/chat/${username}`} className="btn-primary">Message</Link>;

  const action = ACTIONS[relationship];
  const handleClick = async () => {
    setError("");
    try {
      await action.run(username);
      onChange(action.next);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <button onClick={handleClick} className={action.style}>
        {action.label}
      </button>
      {error && <span className="error">{error}</span>}
    </>
  );
}
