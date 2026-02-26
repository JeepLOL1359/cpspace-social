import { useCallback, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";

import { db } from "../../../firebaseConfig";
import { moderateText } from "../../../services/aiModerationService";

function formatCreatedAt(createdAt) {
  if (!createdAt) return "-";

  if (typeof createdAt.toDate === "function") {
    return createdAt.toDate().toLocaleString();
  }

  return "-";
}

export default function FlaggedPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPostId, setBusyPostId] = useState(null);

  useEffect(() => {
    const flaggedPostsQuery = query(
      collection(db, "posts"),
      where("moderationStatus", "==", "Flagged")
    );

    const unsubscribe = onSnapshot(flaggedPostsQuery, (snapshot) => {
      const nextPosts = snapshot.docs.map((postDoc) => ({
        id: postDoc.id,
        ...postDoc.data(),
      }));

      setPosts(nextPosts);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateModerationStatus = useCallback(async (postId, moderationStatus) => {
    setBusyPostId(postId);

    try {
      await updateDoc(doc(db, "posts", postId), {
        moderationStatus,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setBusyPostId(null);
    }
  }, []);

  const reanalysePost = useCallback(async (post) => {
    setBusyPostId(post.id);

    try {
      const { label, confidence } = await moderateText(post.body ?? "");

      await updateDoc(doc(db, "posts", post.id), {
        "ai.label": label,
        "ai.confidence": confidence,
        "ai.lastChecked": serverTimestamp(),
      });
    } finally {
      setBusyPostId(null);
    }
  }, []);

  return (
    <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
      <h2>Flagged Posts</h2>

      {loading ? (
        <p>Loading flagged posts...</p>
      ) : posts.length === 0 ? (
        <p>No flagged posts found.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {posts.map((post) => {
            const isBusy = busyPostId === post.id;

            return (
              <div
                key={post.id}
                style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px" }}
              >
                <p style={{ margin: "0 0 8px" }}><strong>Body:</strong> {post.body || "-"}</p>
                <p style={{ margin: "0 0 8px" }}>
                  <strong>Emotion:</strong> {post.emotionCategory || "-"}
                </p>
                <p style={{ margin: "0 0 8px" }}><strong>AI Label:</strong> {post.ai?.label || "-"}</p>
                <p style={{ margin: "0 0 8px" }}>
                  <strong>AI Confidence:</strong>{" "}
                  {typeof post.ai?.confidence === "number" ? post.ai.confidence : "-"}
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  <strong>Created:</strong> {formatCreatedAt(post.createdAt)}
                </p>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => updateModerationStatus(post.id, "Visible")}
                    disabled={isBusy}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateModerationStatus(post.id, "Hidden")}
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                  <button onClick={() => reanalysePost(post)} disabled={isBusy}>
                    Re-analyse
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
