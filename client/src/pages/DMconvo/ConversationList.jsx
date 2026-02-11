/* src/pages/DMconvo/ConversationList.jsx */

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";

export default function ConversationList({ selected, onSelect }) {
  const [conversations, setConversations] = useState([]);
  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUid)
    );

    const unsub = onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.relationshipStatus !== "blocked");

      setConversations(data);
    });

    return () => unsub();
  }, [currentUid]);

  return (
    <div className="dm-list">
      {conversations.map(c => {
        const other = c.participants.find(
          p => p !== currentUid
        );

        return (
          <div
            key={c.id}
            className={`dm-list-item ${
              selected?.id === c.id ? "active" : ""
            }`}
            onClick={() => onSelect(c)}
          >
            <div>{other}</div>
            <div className="dm-status">
              {c.relationshipStatus}
            </div>
          </div>
        );
      })}
    </div>
  );
}
