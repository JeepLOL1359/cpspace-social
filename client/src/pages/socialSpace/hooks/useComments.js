import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export function useComments(postId) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      where("moderationStatus", "==", "Visible"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, snap => {
      setComments(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    });

    return () => unsub();
  }, [postId]);

  return comments;
}