/* components/PostCard.jsx */

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import "./PostCard.css";

export default function PostCard({ post, pseudonym, onPostUpdated }) {
  const auth = getAuth();
  const isOwner = auth.currentUser?.uid === post.authorId;

  const [showAllComments, setShowAllComments] = useState(false);

  // POST EDIT STATE
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.body);

  // const [emotionCategory, setEmotionCategory] = useState(post.emotionCategory);
  // const [feelings, setFeelings] = useState(post.feelings || []);

  // map stored category → internal key
  function toKey(cat) {
    return cat === "pleasant" ? "pos" : cat === "neutral" ? "neu" : "neg";
  }

  function toLabel(key) {
    return key === "pos" ? "pleasant" : key === "neu" ? "neutral" : "unpleasant";
  }

  function toggleFeeling(f) {
    setSelected(prev =>
      prev.includes(f)
        ? prev.filter(x => x !== f)
        : [...prev, f]
    );
  }

  const [category, setCategory] = useState(toKey(post.emotionCategory));
  const [selected, setSelected] = useState(post.feelings || []);
  const [allFeelings, setAllFeelings] = useState({ pos: [], neu: [], neg: [] });

  const savePost = async () => {
    await updateDoc(doc(db, "posts", post.id), {
      body,
      emotionCategory: toLabel(category),
      feelings: selected,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setEditing(false);
    onPostUpdated(); // 👈 soft refresh
  };

  const deletePost = async () => {
    await updateDoc(doc(db, "posts", post.id), {
      moderationStatus: "Hidden"
    });

    onPostUpdated(); // 👈 soft refresh
  };

  useEffect(() => {
    async function loadFeelings() {
      const snap = await getDoc(doc(db, "defaultFeelings", "default"));
      if (snap.exists()) {
        setAllFeelings(snap.data());
      }
    }
    loadFeelings();
  }, []);

  return (
    <div className="post-card">
      <div className="post-header">
        <strong>{pseudonym}</strong>
        {post.isEdited && <span className="edited-label"> · edited</span>}
      </div>

      {editing ? (
        <>
          {/* CATEGORY */}
          <div className="emotion-categories">
            {["pos", "neu", "neg"].map(c => (
              <button
                key={c}
                className={category === c ? "active" : ""}
                onClick={() => {
                  setCategory(c);
                  setSelected([]); // reset feelings when category changes
                }}
              >
                {c === "pos" ? "Pleasant" : c === "neu" ? "Neutral" : "Unpleasant"}
              </button>
            ))}
          </div>

          {/* FEELINGS */}
          <div className="feelings">
            {allFeelings[category]?.map(f => (
              <span
                key={f}
                className={selected.includes(f) ? "tag active" : "tag"}
                onClick={() => toggleFeeling(f)}
              >
                {f}
              </span>
            ))}
          </div>

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className="diary-textarea"
          />


          <button onClick={savePost}>Save</button>
        </>
      ) : (
        <p>{post.body}</p>
      )}

      {isOwner && (
        <div className="post-owner-actions">
          <button onClick={() => setEditing(v => !v)}>
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={deletePost}>Delete</button>
        </div>
      )}

      <div className="post-actions">
        <button>▲</button>
        <button>▼</button>

        <button onClick={() => setShowAllComments(v => !v)}>
          💬 Comment
        </button>
      </div>

      <CommentList
        postId={post.id}
        expanded={showAllComments}
      />

      {showAllComments && <CommentInput postId={post.id} />}
    </div>
  );
}
