import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Link } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import { getAllStrategies } from "../../services/copingStrategyService";
import "./bookmark.css";

export default function Bookmark() {
  const [bookmarks, setBookmarks] = useState([]);
  const auth = getAuth();

  const deleteBookmark = async (strategyId) => {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(
      doc(db, "users", user.uid, "bookmarks", strategyId)
    );

    setBookmarks((prev) =>
      prev.filter((s) => s.id !== strategyId)
    );
  };

  useEffect(() => {
    async function fetchBookmarks() {
      const user = auth.currentUser;
      if (!user) return;

      const bookmarkRef = collection(db, "users", user.uid, "bookmarks");
      const bookmarkSnap = await getDocs(bookmarkRef);

      const strategyIds = bookmarkSnap.docs.map(
        (doc) => doc.data().strategyId
      );

      if (strategyIds.length === 0) {
        setBookmarks([]);
        return;
      }

      // Fetch full strategy objects
      const strategies = await getAllStrategies();

      const bookmarkedStrategies = strategies.filter((s) =>
        strategyIds.includes(s.id)
      );

      setBookmarks(bookmarkedStrategies);
    }

    fetchBookmarks();
  }, []);

  return (
    <div className="bookmark-page">
      <h2>Bookmarked Strategies</h2>

  {bookmarks.length === 0 ? (
    <p>No bookmarks yet.</p>
  ) : (
    bookmarks.map((strategy) => (
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
          {Array.isArray(strategy.tags)
            ? strategy.tags.join(", ")
            : ""}
        </span>

        <p className="desc">
          {strategy.description}
        </p>

        <button
          className="bookmark-remove-btn"
          aria-label="Remove bookmark"
          title="Remove bookmark"
          onClick={() => deleteBookmark(strategy.id)}
        >
          ×
        </button>
      </div>
    ))
  )}
    </div>
  );
}
