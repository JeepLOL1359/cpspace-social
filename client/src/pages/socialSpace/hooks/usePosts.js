// socialSpace/hooks/usePosts.js
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { useRecentEmotion } from "./useRecentEmotion";

const PAGE_SIZE = 20;
const FETCH_SIZE = 100;

/* ---------- HOT SCORE ---------- */

function wilsonLowerBound(up, down) {
  const n = up + down;
  if (n === 0) return 0;

  const z = 1.96;
  const phat = up / n;

  return (
    (phat + (z * z) / (2 * n) -
      z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  );
}

function computeHotScore(post) {
  const up = post.stats?.up || 0;
  const down = post.stats?.down || 0;

  const wilson = wilsonLowerBound(up, down);

  const createdAt = post.createdAt?.toDate?.();
  if (!createdAt) return wilson;

  const ageHours =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  return wilson / (1 + ageHours / 8);
}

/* ---------- HOOK ---------- */

export function usePosts(mode = "newest") {
  const [allPosts, setAllPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const userEmotion = useRecentEmotion();

  /* ---------- INITIAL LOAD ---------- */
  const loadInitial = async () => {
    setLoading(true);

    const q = query(
      collection(db, "posts"),
      where("moderationStatus", "in", ["Visible", "Flagged"]),
      orderBy("createdAt", "desc"),
      limit(FETCH_SIZE)
    );

    const snap = await getDocs(q);
    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    /* ----- MODE PROCESSING ----- */

    if (mode === "hot") {
      data = data
        .map(p => ({ ...p, _score: computeHotScore(p) }))
        .sort((a, b) => b._score - a._score);
    }

    if (mode === "relevant") {
      if (userEmotion) {
        let relevant = data.filter(
          p => p.emotionCategory === userEmotion
        );

        if (relevant.length < FETCH_SIZE) {
          const rest = data.filter(
            p => p.emotionCategory !== userEmotion
          );
          relevant = [...relevant, ...rest].slice(0, FETCH_SIZE);
        }

        data = relevant
          .map(p => ({ ...p, _score: computeHotScore(p) }))
          .sort((a, b) => b._score - a._score);
      } else {
        // fallback to hot
        data = data
          .map(p => ({ ...p, _score: computeHotScore(p) }))
          .sort((a, b) => b._score - a._score);
      }
    }

    // newest = already ordered by createdAt

    setAllPosts(data);
    setPosts(data.slice(0, PAGE_SIZE));
    setPage(1);
    setHasMore(data.length > PAGE_SIZE);
    setLoading(false);
  };

  /* ---------- LOAD MORE (IN-MEMORY) ---------- */
  const loadMore = () => {
    if (loading || !hasMore) return;

    setPage(p => {
      const next = p + 1;
      const nextPosts = allPosts.slice(0, next * PAGE_SIZE);

      setPosts(nextPosts);
      setHasMore(nextPosts.length < allPosts.length);

      return next;
    });
  };

  // Safe helper: call this on any user interaction
  const tryLoadMore = () => {
    if (!loading && hasMore) {
      loadMore();
    }
  };

  useEffect(() => {
    console.log("POSTS:", posts.length, "ALL:", allPosts.length);
  }, [posts]);

  return {
    posts,
    loadInitial,
    loadMore,
    tryLoadMore,
    loading,
    hasMore
  };
}
