import { usePosts } from "../../hooks/usePosts";
import PostCard from "../../components/PostCard";
import { useState } from "react";

export default function SocialSpace() {
  const { posts, loading } = usePosts();
  const [query, setQuery] = useState("");

  const filteredPosts = posts.filter(p =>
    p.body.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <input
        type="text"
        placeholder="Search posts..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {filteredPosts.map(p => (
        <PostCard key={p.id} post={p} />
      ))}
    </>
  );
}
