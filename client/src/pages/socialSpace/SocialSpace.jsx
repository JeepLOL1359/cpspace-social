  // socialSpace/SocialSpace.jsx
import { useEffect, useState, useRef } from "react";
import { usePosts } from "./hooks/usePosts";
import PostCard from "./components/PostCard";
import "./socialSpace.css";
import { usePublicPseudonyms } from "./hooks/usePublicPseudonyms";
import CreatePostModal from "./components/CreatePostModal";

export default function SocialSpace() {
  const [query, setQuery] = useState("");
  const pseudonymMap = usePublicPseudonyms();

  const [showCreatePost, setShowCreatePost] = useState(false);

  const [mode, setMode] = useState("newest");
  const { posts, loadInitial, loadMore, loading, hasMore } =
    usePosts(mode);

  function refreshFeed() {
    loadInitial();
  }

  useEffect(() => {
    loadInitial();
  }, [mode]);

  useEffect(() => {
    function onScroll() {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300;

      if (nearBottom && !loading && hasMore) {
        loadMore();
      }
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadMore, loading, hasMore]);

  const filtered = posts.filter(p =>
    p.body.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="social-space-page">
      {/* TOP BAR */}
      <div className="social-space-topbar">
        <div className="topbar-left">
          <span className="topbar-title">Social Space</span>
        </div>

        <div className="topbar-center">
          <button
            className={mode === "newest" ? "active" : ""}
            onClick={() => setMode("newest")}
          >
            Newest
          </button>

          <button
            className={mode === "hot" ? "active" : ""}
            onClick={() => setMode("hot")}
          >
            Hot
          </button>

          <button
            className={mode === "relevant" ? "active" : ""}
            onClick={() => setMode("relevant")}
          >
            Relevant
          </button>
        </div>

        <div className="topbar-right">
          {/* future actions */}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="social-space-layout">
      
        {/* FEED */}
        <div className="social-space">
            <div className="social-space__feed">
            {filtered.map(p => (
              <PostCard
                key={p.id}
                post={p}
                pseudonym={pseudonymMap[p.authorId] || "Anonymous"}
                onPostUpdated={refreshFeed}
                loadMore={loadMore}
              />
            ))}
          </div>

          {!hasMore && (
            <div className="end-of-feed">
              <div className="end-of-feed__icon">🌱</div>
              <div className="end-of-feed__text">
                You’re all caught up
              </div>
            </div>
          )}

          {hasMore && (
            <button
              className="social-space__load-more"
              onClick={loadMore}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </div>

        {/* RIGHT PANEL */}
        <aside className="social-space__side">
          <h3>Search</h3>

          <input
            className="side-search"
            placeholder="Search a post"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          <div className="trending">
            <div>⭐ No.1 Trending<br />KFC</div>
            <div>⭐ No.2 Trending<br />Kota Kinabalu</div>
            <div>⭐ No.3 Trending<br />Donald Duck</div>
          </div>
        </aside>
      </div>

      <button
        className="floating-create-btn"
        onClick={() => setShowCreatePost(true)}
      >
        +
      </button>

      {showCreatePost && (
        <CreatePostModal
          onClose={() => {
            setShowCreatePost(false);
            loadInitial();
          }}
        />
      )}

    </div>
  );
}
