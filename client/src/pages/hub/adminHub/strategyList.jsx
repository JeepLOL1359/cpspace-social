import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllStrategies,
  deleteStrategy,
} from "../../../services/copingStrategyService";
import "./strategyList.css";

export default function AdminStrategyList() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStrategies() {
      try {
        const data = await getAllStrategies();
        setStrategies(data);
      } catch (err) {
        console.error("Failed to load strategies:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStrategies();
  }, []);

  async function handleDelete(id) {
    const ok = window.confirm(
      "Are you sure you want to delete this strategy?"
    );
    if (!ok) return;

    try {
      await deleteStrategy(id);
      setStrategies((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete strategy:", err);
    }
  }

  if (loading) {
    return <p>Loading strategies...</p>;
  }

  return (
    <div className="admin-strategy-page">
      <div className="admin-header">
        <h2>Coping Strategies (Admin)</h2>

        <Link to="/admin/strategies/new" className="add-btn">
          + Add Strategy
        </Link>
      </div>

      {strategies.length === 0 ? (
        <p>No strategies found.</p>
      ) : (
        <table className="strategy-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {strategies.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.author}</td>
                <td>
                  {Array.isArray(s.tags) ? s.tags.join(", ") : ""}
                </td>
                <td className="actions">
                  <Link
                    to={`/admin/strategies/edit/${s.id}`}
                    className="edit-btn"
                  >
                    Edit
                  </Link>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
