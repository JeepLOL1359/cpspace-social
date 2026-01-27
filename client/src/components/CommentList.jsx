import { useComments } from "../hooks/useComments";

export default function CommentList({ postId }) {
  const comments = useComments(postId);

  if (comments.length === 0) {
    return <p className="muted">No comments yet</p>;
  }

  return (
    <div className="comment-list">
      {comments.map(c => (
        <div key={c.id} className="comment">
          <span className="author">AnonymousUser</span>
          <p>{c.body}</p>
        </div>
      ))}
    </div>
  );
}
