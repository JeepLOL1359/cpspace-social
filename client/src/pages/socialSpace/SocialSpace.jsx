import { useEffect, useState } from "react";
import { usePosts } from "../../hooks/usePosts";
import PostCard from "../../components/PostCard";
import "./socialSpace.css";

export default function SocialSpace() {
  const { posts, loadInitial, loadMore, loading } = usePosts();
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadInitial();
  }, []);

  const filtered = posts.filter(p =>
    p.body.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="social-space">
      <input
        className="social-space__search"
        placeholder="Search posts"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="social-space__feed">
        {filtered.map(p => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <button
        className="social-space__load-more"
        onClick={loadMore}
        disabled={loading}
      >
        {loading ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
