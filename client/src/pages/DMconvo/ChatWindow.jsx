/* src/pages/DMconvo/ChatWindow.jsx */

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { useRelationship } from "./hooks/useRelationship";

export default function ChatWindow({ conversation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  const targetUid = conversation?.participants?.find(
    p => p !== currentUid
  );

  const { status, canChat } =
    useRelationship(currentUid, targetUid);

  useEffect(() => {
    if (!conversation) return;

    const q = query(
      collection(
        db,
        "conversations",
        conversation.id,
        "messages"
      ),
      orderBy("seq", "asc")
    );

    const unsub = onSnapshot(q, snap => {
      setMessages(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
      );
    });

    return () => unsub();
  }, [conversation]);

  async function handleSend() {
    if (!canChat || !input.trim()) return;

    const convoRef = doc(
      db,
      "conversations",
      conversation.id
    );

    const nextSeq = conversation.nextSeq || 1;

    await addDoc(
      collection(
        db,
        "conversations",
        conversation.id,
        "messages"
      ),
      {
        senderId: currentUid,
        body: input,
        seq: nextSeq,
        createdAt: serverTimestamp(),
        hiddenUntilConsent: false
      }
    );

    await updateDoc(convoRef, {
      nextSeq: increment(1),
      lastMessageAt: serverTimestamp()
    });

    setInput("");
  }

  if (!conversation) {
    return <div className="dm-empty">Select a chat</div>;
  }

  return (
    <div className="dm-chat">
      <div className="dm-messages">
        {messages.map(m => (
          <div
            key={m.id}
            className={
              m.senderId === currentUid
                ? "dm-msg mine"
                : "dm-msg"
            }
          >
            {m.body}
          </div>
        ))}
      </div>

      {status !== "consented" && (
        <div className="dm-warning">
          {status === "pending" &&
            "Waiting for acceptance..."}
          {status === "revoked" &&
            "Connection revoked. Messaging disabled."}
        </div>
      )}

      <div className="dm-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!canChat}
          placeholder={
            canChat
              ? "Type a message..."
              : "Messaging disabled"
          }
        />
        <button
          onClick={handleSend}
          disabled={!canChat}
        >
          Send
        </button>
      </div>
    </div>
  );
}
