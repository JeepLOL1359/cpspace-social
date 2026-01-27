import CommentList from "./CommentList";
import "./PostCard.css";

export default function PostCard({ post }) {
  return (
    <div className="post-card">
      <div className="post-header">
        <strong>{post.pseudonym ?? "Anonymous"}</strong>
      </div>

      <p>{post.body}</p>

      <div className="post-actions">
        <button>▲ {post.stats?.up ?? 0}</button>
        <button>▼ {post.stats?.down ?? 0}</button>
        <button>💬 Comment</button>
      </div>

      {/* Inline comments */}
      <CommentList postId={post.id} />
    </div>
  );
}
