// src/pages/Diary/DiaryPage.jsx
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import DiaryEmotionModal from "./DiaryEmotionModal";
import "./diary.css";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatTime(ts) {
  if (!ts) return "";
  const date = ts.toDate();
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DiaryPage() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [todayEntry, setTodayEntry] = useState(null);
  const [diaryText, setDiaryText] = useState("");

  // added for emotion logging and reflection distinction (v3)
  const [emotionDiaries, setEmotionDiaries] = useState([]);
  const [reflectionDiaries, setReflectionDiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("all");
  // "all" | "pleasant" | "neutral" | "unpleasant"

  const [isReflectionMode, setIsReflectionMode] = useState(false);

  // For update and delete functions 
  const [editingEmotion, setEditingEmotion] = useState(null);
  const [editingReflection, setEditingReflection] = useState(null);

  const filteredEmotionDiaries =
    activeCategory === "all"
      ? emotionDiaries
      : emotionDiaries.filter(
          (d) => d.category === activeCategory
        );

  function handleEditEmotion(entry) {
    setEditingEmotion(entry);
    setIsReflectionMode(false);      // ensure emotion mode
    setShowEmotionModal(true);
  }

  function handleEditReflection(entry) {
    setEditingReflection(entry);
    setDiaryText(entry.body);
    setIsReflectionMode(true);
    setShowEmotionModal(true);
  }

  async function saveEmotionDiary({ category, feelings }) {
    if (!user) return;

    // EDIT MODE
    if (editingEmotion) {
      await updateDoc(
        doc(db, "users", user.uid, "diaries", editingEmotion.id),
        {
          category,
          feelings,
        }
      );
    } 
    // CREATE MODE
    else {
      await addDoc(
        collection(db, "users", user.uid, "diaries"),
        {
          type: "emotion",
          category,
          feelings,
          body: "",
          createdAt: serverTimestamp(),
        }
      );
    }

    setEditingEmotion(null);
    setShowEmotionModal(false);
    loadTodayDiary();
  }

  async function saveReflectionDiary({ category, feelings }) {
    if (!user) return;
    if (!diaryText.trim()) return;

    // EDIT MODE
    if (editingReflection) {
      await updateDoc(
        doc(db, "users", user.uid, "diaries", editingReflection.id),
        {
          category,
          feelings,
          body: diaryText,
        }
      );
    }
    // CREATE MODE
    else {
      await addDoc(
        collection(db, "users", user.uid, "diaries"),
        {
          type: "reflection",
          category,
          feelings,
          body: diaryText,
          createdAt: serverTimestamp(),
        }
      );
    }

    setEditingReflection(null);
    setDiaryText("");
    setShowEmotionModal(false);
    loadTodayDiary();
  }

  async function loadTodayDiary() {
    if (!user) return;

    setLoading(true);

    const { start, end } = getTodayRange();

    const q = query(
      collection(db, "users", user.uid, "diaries"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    );

    const snap = await getDocs(q);

    const emotions = [];
    const reflections = [];

    snap.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };

      if (data.type === "emotion") {
        emotions.push(data);
      } else if (data.type === "reflection") {
        reflections.push(data);
      }
    });

    // optional: sort by time (oldest → newest)
    emotions.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
    reflections.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

    setEmotionDiaries(emotions);
    setReflectionDiaries(reflections);

    setLoading(false);
  }

  // Delete handler for emotion logs
  async function handleDeleteEmotion(entryId) {
    if (!user) return;

    const ok = window.confirm("Delete this emotion log?");
    if (!ok) return;

    await deleteDoc(
      doc(db, "users", user.uid, "diaries", entryId)
    );

    loadTodayDiary();
  }

  // Delete handler for reflection diaries
  async function handleDeleteReflection(entryId) {
    if (!user) return;

    const ok = window.confirm("Delete this diary entry?");
    if (!ok) return;

    await deleteDoc(
      doc(db, "users", user.uid, "diaries", entryId)
    );

    loadTodayDiary();
  }

  useEffect(() => {
    loadTodayDiary();
  }, [user]);

  return (
    <div className="diary-layout">
      {/* CENTER */}
      <main className="diary-main">
        <div className="diary-actions">
          <button onClick={() => setShowEmotionModal(true)}>
            Today’s Emotion +
          </button>
          <button
            onClick={() => {
              setIsReflectionMode(true);
              setShowEmotionModal(true);
            }}
          >
            Diary +
          </button>
        </div>

        {/* EMOTION CATEGORY FILTER BAR */}
        <div className="emotion-filter-bar">
          {["pleasant", "neutral", "unpleasant"].map((cat) => (
            <button
              key={cat}
              className={
                activeCategory === cat
                  ? "filter-btn active"
                  : "filter-btn"
              }
              onClick={() =>
                setActiveCategory(
                  activeCategory === cat ? "all" : cat
                )
              }
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>  

        {loading ? (
          <div className="diary-placeholder">
            Loading today’s diary...
          </div>
        ) : (
          <>
            {/* TOP: Emotion-only diaries */}
            <div className="diary-entry">
              {emotionDiaries.length === 0 ? (
                <div className="diary-placeholder">
                  You haven’t recorded today’s emotion yet.
                  <br />
                  Click <strong>“Today’s Emotion +”</strong> to record.
                </div>
              ) : (
                <div className="diary-meta">

                  {filteredEmotionDiaries.map((entry) => (
                    <div key={entry.id} className="emotion-bubble">
                      <span className="emotion-time">
                        {formatTime(entry.createdAt)}
                      </span>

                      <span className="emotion-feelings">
                        {entry.feelings.join(", ")}
                      </span>

                      <span
                        className="emotion-action"
                        onClick={() => handleEditEmotion(entry)}
                        title="Edit"
                      >
                        ✎
                      </span>

                      <span
                        className="emotion-action"
                        onClick={() => handleDeleteEmotion(entry.id)}
                        title="Delete"
                      >
                        🗑
                      </span>
                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* BOTTOM: Reflection diaries */}
            <div className="diary-entry" style={{ marginTop: "32px" }}>
              {reflectionDiaries.length === 0 ? (
                <div className="diary-placeholder">
                  You haven’t written a diary yet.
                  <br />
                  Click <strong>“Diary +”</strong> to write one.
                </div>
              ) : (

                reflectionDiaries.map((entry) => (
                  <div key={entry.id} style={{ marginBottom: "24px" }}>
                    <div className="diary-meta">
                      <span className="diary-emotion">{entry.category}</span>
                      {entry.feelings.map((f) => (
                        <span key={f} className="tag active">{f}</span>
                      ))}

                      <span
                        className="emotion-action"
                        onClick={() => handleEditReflection(entry)}
                        title="Edit"
                      >
                        ✎
                      </span>

                      <span
                        className="emotion-action"
                        onClick={() => handleDeleteReflection(entry.id)}
                        title="Delete"
                      >
                        🗑
                      </span>
                    </div>

                    <p className="diary-body">{entry.body}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

      </main>

      {/* RIGHT PANEL */}
      <aside className="diary-side">
        <h3>Today’s Event List</h3>
        <button disabled>Record an event +</button>
      </aside>

      {showEmotionModal && (
        <DiaryEmotionModal
          mode={isReflectionMode ? "reflection" : "emotion"}
          initialCategory={editingEmotion?.category}
          initialFeelings={editingEmotion?.feelings}
          diaryText={diaryText}
          setDiaryText={setDiaryText}
          onClose={() => {
            setShowEmotionModal(false);
            setEditingEmotion(null);
            setIsReflectionMode(false);
            setDiaryText("");
          }}
          onSave={
            isReflectionMode
              ? saveReflectionDiary
              : saveEmotionDiary
          }
        />
      )}
    </div>
  );
}

