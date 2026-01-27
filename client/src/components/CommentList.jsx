import { useComments } from "../hooks/useComments";
import CommentItem from "./CommentItem";

export default function CommentList({ postId }) {
  const comments = useComments(postId);

  return (
    <div className="comment-list">
      {comments.map(c => (
        <CommentItem key={c.id} comment={c} />
      ))}
    </div>
  );
}
