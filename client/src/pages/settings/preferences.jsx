import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./preferences.css";

const COLOR_MAP = {
  blue: {
    accent: "#60a5fa",
    soft: "#dbeafe",
  },
  green: {
    accent: "#34d399",
    soft: "#d1fae5",
  },
  yellow: {
    accent: "#facc15",
    soft: "#fef3c7",
  },
  orange: {
    accent: "#fb923c",
    soft: "#ffedd5",
  },
  pink: {
    accent: "#f472b6",
    soft: "#fce7f3",
  },
};


export default function Personalization() {
  const [settings, setSettings] = useState(null);
  const auth = getAuth();

  const applyTheme = (mode) => {
    document.documentElement.setAttribute("data-theme", mode);
  };

  const applyColor = (color) => {
    const palette = COLOR_MAP[color];
    if (!palette) return;

    document.documentElement.style.setProperty("--accent", palette.accent);
    document.documentElement.style.setProperty("--accent-soft", palette.soft);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
         const data = snap.data().personalization || {};
        setSettings(data);

        if (data.themeMode) applyTheme(data.themeMode);
        if (data.colorPalette) applyColor(data.colorPalette);;
      }
    });

    return () => unsubscribe();
  }, [auth]);

  if (!settings) return <p>Loading preferences...</p>;

  const savePersonalization = async (updates) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        personalization: {
          ...settings,
          ...updates,
        },
      });
    } catch (err) {
      console.error("Failed to save personalization", err);
    }
  };

  return (
    <div className="personalization-panel">
      <h2>Personalization & Preferences</h2>

    {/* Chatbot Tone */}
    <div className="setting-row">
      <label>Chatbot Tone</label>
      <select
        value={settings.chatbotTone || "casual"}
        onChange={(e) => {
          const tone = e.target.value;
          setSettings((prev) => ({ ...prev, chatbotTone: tone }));
          savePersonalization({ chatbotTone: tone });
        }}
      >
        <option value="casual">Casual</option>
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
      </select>
    </div>

      {/* Theme Palette */}
      <div className="setting-row">
        <label>Theme Palette</label>

        <div className="theme-toggle">
          <div
            className={`theme-circle ${
              settings.themeMode === "light" ? "active" : ""
            }`}
              onClick={() => {
                const mode = "light";
                applyTheme(mode);
                setSettings((prev) => ({ ...prev, themeMode: mode }));
                savePersonalization({ themeMode: mode });
              }}
          />
          <div
            className={`theme-circle dark ${
              settings.themeMode === "dark" ? "active" : ""
            }`}
              onClick={() => {
                const mode = "dark";
                applyTheme(mode);
                setSettings((prev) => ({ ...prev, themeMode: mode }));
                savePersonalization({ themeMode: mode });
              }}
          />
        </div>
      </div>

      {/* Color Palette */}
      <div className="setting-row">
        <label>
          Color Palette <span className="info">?</span>
        </label>

        <div className="color-palette">
          {["blue", "green", "yellow", "orange", "pink"].map((color) => (
            <div
              key={color}
              className={`color-circle ${color} ${
                settings.colorPalette === color ? "selected" : ""
              }`}
              onClick={() => {
                setSettings((prev) => ({ ...prev, colorPalette: color }));
                applyColor(color);
                savePersonalization({ colorPalette: color });
              }}
            />
          ))}
        </div>
      </div>

      {/* Auto Personalization */}
      <div className="setting-row">
        <label>Auto Personalization?</label>
        <p className="description">
          If yes, system will automatically change personalization settings
          based on your diary activities.
        </p>

      <div className="yes-no">
        <button
          className={settings.autoPersonalization ? "active" : ""}
            onClick={() => {
              setSettings((prev) => ({ ...prev, autoPersonalization: true }));
              savePersonalization({ autoPersonalization: true });
            }}
        >
          YES
        </button>

        <button
          className={!settings.autoPersonalization ? "active" : ""}
            onClick={() => {
              setSettings((prev) => ({ ...prev, autoPersonalization: false }));
              savePersonalization({ autoPersonalization: false });
            }}
        >
          NO
        </button>
      </div>
      </div>
    </div>
  );
}
