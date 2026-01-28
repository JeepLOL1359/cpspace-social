import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getStrategyById } from "../../services/copingStrategyService";
import "./strategyDetail.css";

export default function StrategyDetail() {
  const { id } = useParams();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStrategy() {
      try {
        const data = await getStrategyById(id);
        setStrategy(data);
      } catch (err) {
        console.error("Failed to load strategy:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStrategy();
  }, [id]);

  if (loading) {
    return <p>Loading strategy...</p>;
  }

  if (!strategy) {
    return <div className="strategy-not-found">Strategy not found.</div>;
  }

  return(
    <div className="strategy-detail-page">
      <h2 className="strategy-title">{strategy.title}</h2>

      <div className="strategy-meta">
        <span>Author: {strategy.author}</span>
        <span className="tag">
          {Array.isArray(strategy.tags) ? strategy.tags.join(", ") : ""}
        </span>
      </div>

      <div className="strategy-description">
        {strategy.description}
      </div>

      {strategy.audioUrl && (
        <audio controls src={strategy.audioUrl} />
      )}

      {strategy.videoUrl && (
        <video controls src={strategy.videoUrl} />
      )}

      <div className="strategy-description">
        <strong>Instructions</strong>
        <p>{strategy.instructions}</p>
      </div>
    </div>
  );
}
