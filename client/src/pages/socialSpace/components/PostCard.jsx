import CommentList from "./CommentList";
import "./PostCard.css";

export default function PostCard({ post, pseudonym }) {
  return (
    <div className="post-card">
      <div className="post-header">
        <strong>{pseudonym}</strong>
      </div>

      <p>{post.body}</p>

      <div className="post-actions">
        <button>▲ Upvote </button>
        <button>▼ Downvote</button>
        <button>💬 Comment</button>
      </div>

      {/* Inline comments */}
      <CommentList postId={post.id} />
    </div>
  );
}
