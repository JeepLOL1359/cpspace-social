// socialSpace/hooks/useGlobalSearch.js

import { useEffect, useState } from "react";
import {
  collection,
  query as fsQuery,
  where,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";

const INITIAL_LIMIT = 20;
const INCREMENT = 20;
const HISTORY_LIMIT = 20;
const HISTORY_KEY = "socialSearchHistory";

/* ---------- SEARCH HISTORY ---------- */

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(term) {
  if (!term) return;

  const prev = loadHistory();
  const next = [
    term,
    ...prev.filter(t => t !== term)
  ].slice(0, HISTORY_LIMIT);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

/* ---------- RELEVANCE ---------- */

function computeRelevance(post, query) {
  if (!query) return 0;

  const q = query.toLowerCase();
  let score = 0;

  const body = post.body?.toLowerCase() || "";
  const words = q.split(/\s+/).filter(Boolean);

  // full query match
  if (body.includes(q)) score += 3;

  // keyword matches
  for (const w of words) {
    if (body.includes(w)) score += 1;
  }

  // feelings match
  if (post.feelings?.some(f => f.toLowerCase().includes(q))) {
    score += 1;
  }

  return score;
}

/* ---------- HOOK ---------- */

export function useGlobalSearch() {
  const [results, setResults] = useState([]);
  const [limitCount, setLimitCount] = useState(INITIAL_LIMIT);
  const [loading, setLoading] = useState(false);
  const [searchedAll, setSearchedAll] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [history, setHistory] = useState(loadHistory());

  function clearHistory() {
    localStorage.removeItem("socialSearchHistory");
    setHistory([]); // 👈 force UI update
    }

  async function runSearch(queryText, customLimit = INITIAL_LIMIT) {
    if (!queryText.trim()) return;

    setLoading(true);
    setCurrentQuery(queryText);

    saveHistory(queryText);
    setHistory(loadHistory());

    const q = fsQuery(
      collection(db, "posts"),
      where("moderationStatus", "in", ["Visible", "Flagged"]),
      orderBy("createdAt", "desc"),
      limit(customLimit)
    );

    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const filtered = docs
      .map(p => ({
        ...p,
        _relevance: computeRelevance(p, queryText)
      }))
      .filter(p => p._relevance > 0);

    filtered.sort((a, b) =>
      b._relevance - a._relevance ||
      b.createdAt?.seconds - a.createdAt?.seconds
    );

    setResults(filtered);
    setLimitCount(customLimit);
    setSearchedAll(docs.length < customLimit);
    setLoading(false);
  }

  function search(queryText) {
    runSearch(queryText, INITIAL_LIMIT);
  }

  function searchMore() {
    if (loading || searchedAll) return;
    runSearch(currentQuery, limitCount + INCREMENT);
  }

  function clearSearch() {
    setResults([]);
    setCurrentQuery("");
    setLimitCount(INITIAL_LIMIT);
    setSearchedAll(false);
  }

  return {
    results,
    loading,
    searchedAll,
    search,
    searchMore,
    clearSearch,
    history,
    currentQuery,
    clearHistory   
  };
}
