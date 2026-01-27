import { useState } from "react";
import CommentList from "./CommentList";

export default function PostCard({ post }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="post-card">
      <p>{post.body}</p>

      <div className="post-actions">
        <button>▲ {post.stats?.up ?? 0}</button>
        <button>▼ {post.stats?.down ?? 0}</button>
        <button onClick={() => setOpen(v => !v)}>
          💬 {open ? "Hide" : "View"} comments
        </button>
      </div>

      {open && <CommentList postId={post.id} />}
    </div>
  );
}
