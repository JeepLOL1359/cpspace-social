export default function CommentItem({ comment }) {
  return (
    <div className="comment">
      <span className="comment-author">
        {comment.pseudonym ?? "Anonymous"}
      </span>
      <p>{comment.body}</p>
    </div>
  );
}
