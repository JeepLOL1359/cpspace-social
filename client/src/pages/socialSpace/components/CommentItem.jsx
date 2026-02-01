export default function CommentItem({ comment, pseudonym }) {
  return (
    <div className="comment">
      <span className="comment-author">{pseudonym}</span>
      <p>{comment.body}</p>
    </div>
  );
}
