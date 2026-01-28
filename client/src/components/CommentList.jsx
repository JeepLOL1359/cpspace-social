// components/CommentList.jsx
import { useComments } from "../hooks/useComments";
import CommentItem from "./CommentItem";
import { usePublicPseudonyms } from "../hooks/usePublicPseudonyms";

export default function CommentList({ postId }) {
  const comments = useComments(postId);
  const pseudonymMap = usePublicPseudonyms();

  return (
    <div className="comment-list">
      {comments.map(c => (
        <CommentItem
          key={c.id}
          comment={c}
          pseudonym={pseudonymMap[c.authorId] || "Anonymous"}
        />
      ))}
    </div>
  );
}
