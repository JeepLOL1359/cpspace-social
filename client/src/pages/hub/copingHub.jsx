// CopingHub.jsx
// User-facing, read-only Coping Strategy Hub

import "./copingHub.css";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { getAllStrategies } from "../../services/copingStrategyService";

import { getAuth } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";

import bookmarkIcon from "../../assets/bookmark.png";

export default function CopingHub() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const [user, setUser] = useState(null);

    useEffect(() => {
    async function fetchStrategies() {
        try {
        const data = await getAllStrategies();
        setStrategies(data);
        } catch (error) {
        console.error("Failed to load strategies:", error);
        } finally {
        setLoading(false);
        }
    }

    fetchStrategies();
    }, []);
  
    const filteredStrategies = strategies.filter((strategy) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;

    const title = strategy.title?.toLowerCase() || "";
    const author = strategy.author?.toLowerCase() || "";
    const description = strategy.description?.toLowerCase() || "";
    const tags = Array.isArray(strategy.tags) ? strategy.tags : [];

    return (
        title.includes(q) ||
        author.includes(q) ||
        description.includes(q) ||
        tags.some(tag => tag.toLowerCase().includes(q))
    );
    });

    const auth = getAuth();

    const toggleBookmark = async (strategyId) => {
      const user = auth.currentUser;
      if (!user) return;

      const bookmarkRef = doc(
        db,
        "users",
        user.uid,
        "bookmarks",
        strategyId
      );

      try {
        const snap = await getDoc(bookmarkRef);

        if (snap.exists()) {
          await deleteDoc(bookmarkRef);
          setBookmarkedIds((prev) =>
            prev.filter((id) => id !== strategyId)
          );
        } else {
          await setDoc(bookmarkRef, {
            strategyId,
            createdAt: serverTimestamp(),
          });
          setBookmarkedIds((prev) => [...prev, strategyId]);
        }
      } catch (err) {
        console.error("Toggle bookmark failed:", err);
      }
    };

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
      });

      return () => unsubscribe();
    }, []);

    useEffect(() => {
      if (!user) return;

      async function loadBookmarks() {
        try {
          const snap = await getDocs(
            collection(db, "users", user.uid, "bookmarks")
          );

          setBookmarkedIds(snap.docs.map((doc) => doc.id));
        } catch (err) {
          console.error("Failed to load bookmarks:", err);
        }
      }

      loadBookmarks();
    }, [user]);

  return (
    <div className="copinghub-page">

      {/* ===== HEADER ===== */}
      <header className="copinghub-header">
        <div className="hub-title">
          <h1>CP HUB</h1>
        </div>

        <div className="hub-search">
            <input
            type="text"
            placeholder="Search your strategy here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                setSearchQuery(inputValue);
                }
            }}
            />
            <button onClick={() => setSearchQuery(inputValue)}>
            🔍
            </button>
        </div>

        <div className="hub-actions">
          <a href="/coping-hub/bookmarks">
            <img
              src={bookmarkIcon}
              alt="Bookmarked strategies"
              className="bookmark-icon"
            />
          </a>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="copinghub-content">

        {/* LEFT COLUMN */}
        <aside className="copinghub-left">
          <h3>Recommended Strategy for You</h3>

          <div className="strategy-card">
            <a href="#">A Yoga A Day, Keep Your Day Amazed</a>
            <p className="author">Author: Kim Gery</p>
            <span className="tag">Relaxation</span>
            <p className="desc">
              Unwind your mind and body with this calming yoga flow
              designed for all levels. Follow a series of slow,
              mindful movements that release tension...
            </p>
          </div>

          <div className="strategy-card">
            <a href="#">Pause & Ponder: A Gentle Flow for Self-Reflection</a>
            <p className="author">Author: Amelia Tan</p>
            <span className="tag">Relaxation</span>
            <p className="desc">
              Move through a slow, introspective sequence designed
              to help you reconnect with yourself...
            </p>
          </div>
        </aside>

        {/* RIGHT COLUMN */}
        <main className="copinghub-right">
        <h3>Search result: {searchQuery || "All"}</h3>

        {loading ? (
            <p>Loading strategies...</p>
        ) : filteredStrategies.length === 0 ? (
            <p>No strategies found.</p>
        ) : (
            filteredStrategies.map((strategy) => (
            <div key={strategy.id} className="result-card">
                <h4>
                <Link
                    to={`/coping-hub/${strategy.id}`}
                    className="strategy-link"
                >
                    {strategy.title}
                </Link>
                </h4>

                <p className="author">Author: {strategy.author}</p>
                <span className="tag">
                {Array.isArray(strategy.tags) ? strategy.tags.join(", ") : ""}
                </span>
                <p className="desc">
                {strategy.description}
                </p>
                <button
                  className={`bookmark ${
                    bookmarkedIds.includes(strategy.id) ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleBookmark(strategy.id);
                  }}
                >
                  {bookmarkedIds.includes(strategy.id) ? "⭐" : "☆"}
                </button>
            </div>
            ))
        )}
        </main>
      </div>
    </div>
  );
}
