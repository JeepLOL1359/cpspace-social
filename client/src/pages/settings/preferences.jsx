import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./preferences.css";

const COLOR_MAP = {
  blue: { accent: "#60a5fa", soft: "#dbeafe" },
  green: { accent: "#34d399", soft: "#d1fae5" },
  yellow: { accent: "#facc15", soft: "#fef3c7" },
  orange: { accent: "#fb923c", soft: "#ffedd5" },
  pink: { accent: "#f472b6", soft: "#fce7f3" },
};

const DEFAULT_PREFS = {
  chatbotTone: "casual",
  themeMode: "light",
  colorPalette: "blue",
  autoPersonalisation: false,
};

export default function Preferences() {
  const [prefs, setPrefs] = useState(null);
  const auth = getAuth();

  /* === APPLY UI EFFECTS (your old logic) === */
  const applyTheme = (mode) => {
    document.documentElement.setAttribute("data-theme", mode);
  };

  const applyColor = (color) => {
    const palette = COLOR_MAP[color];
    if (!palette) return;
    document.documentElement.style.setProperty("--accent", palette.accent);
    document.documentElement.style.setProperty("--accent-soft", palette.soft);
  };

  /* === LOAD === */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      const data = snap.exists() ? snap.data().preferences : {};
      const merged = { ...DEFAULT_PREFS, ...data };

      setPrefs(merged);
      applyTheme(merged.themeMode);
      applyColor(merged.colorPalette);

      localStorage.setItem("theme", merged.themeMode);
    });

    return unsub;
  }, [auth]);

  /* === SAVE (friend structure, fixed) === */
  const savePrefs = async (updates) => {
    const user = auth.currentUser;
    if (!user) return;

    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);

    await setDoc(
      doc(db, "users", user.uid),
      { preferences: newPrefs },
      { merge: true }
    );
  };

  if (!prefs) return <p>Loading preferences...</p>;

  return (
    <div className="personalization-panel">
      <h2>Preferences</h2>

      {/* Chatbot Tone */}
      <div className="setting-row">
        <label>Chatbot Tone</label>
        <select
          value={prefs.chatbotTone}
          onChange={(e) =>
            savePrefs({ chatbotTone: e.target.value })
          }
        >
          <option value="casual">Casual</option>
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
        </select>
      </div>

      {/* Theme */}
      <div className="setting-row">
        <label>Theme</label>
        <div className="theme-toggle">
          <div
            className={`theme-circle ${prefs.themeMode === "light" ? "active" : ""}`}
            onClick={() => {
              applyTheme("light");
              localStorage.setItem("theme", "light");
              savePrefs({ themeMode: "light" });
            }}
          />
          <div
            className={`theme-circle dark ${prefs.themeMode === "dark" ? "active" : ""}`}
            onClick={() => {
              applyTheme("dark");
              localStorage.setItem("theme", "dark");
              savePrefs({ themeMode: "dark" });
            }}
          />
        </div>
      </div>

      {/* Color Palette */}
      <div className="setting-row">
        <label>Color Palette</label>
        <div className="color-palette">
          {Object.keys(COLOR_MAP).map((color) => (
            <div
              key={color}
              className={`color-circle ${color} ${
                prefs.colorPalette === color ? "selected" : ""
              }`}
              onClick={() => {
                applyColor(color);
                savePrefs({ colorPalette: color });
              }}
            />
          ))}
        </div>
      </div>

      {/* Auto Personalisation */}
      <div className="setting-row">
        <label>Auto Personalisation</label>
        <div className="yes-no">
          <button
            className={prefs.autoPersonalisation ? "active" : ""}
            onClick={() => savePrefs({ autoPersonalisation: true })}
          >
            YES
          </button>
          <button
            className={!prefs.autoPersonalisation ? "active" : ""}
            onClick={() => savePrefs({ autoPersonalisation: false })}
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
