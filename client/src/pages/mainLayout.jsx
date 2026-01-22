import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./mainLayout.css";

//temp
import { signOut } from "firebase/auth";

const COLOR_MAP = {
  blue: { accent: "#60a5fa", soft: "#dbeafe" },
  green: { accent: "#34d399", soft: "#d1fae5" },
  yellow: { accent: "#facc15", soft: "#fef3c7" },
  orange: { accent: "#fb923c", soft: "#ffedd5" },
  pink: { accent: "#f472b6", soft: "#fce7f3" },
};

export default function MainLayout() {
  const [userData, setUserData] = useState(null);
  const auth = getAuth();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setReady(true);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        setReady(true);
        return;
      }

      const data = snap.data();
      setUserData(data);

      const p = data.personalization;
      if (p) {
        document.documentElement.setAttribute(
          "data-theme",
          p.themeMode || "light"
        );

        if (p.colorPalette && COLOR_MAP[p.colorPalette]) {
          document.documentElement.style.setProperty(
            "--accent",
            COLOR_MAP[p.colorPalette].accent
          );
          document.documentElement.style.setProperty(
            "--accent-soft",
            COLOR_MAP[p.colorPalette].soft
          );
        }
      }

      // ✅ Mark app as ready ONLY after theme applied
      setReady(true);
    });

    return () => unsub();
  }, [auth]);

  if (!ready) return null;

  return (
    <div className="app-container">
      {/* MAIN SIDEBAR */}
      <aside className="sidebar main-sidebar">
        <div className="logo">CPSPACE</div>

        <nav>
        <NavLink to="/diary" className="main-link">Diary</NavLink>
        <NavLink to="/social" className="main-link">Social Space</NavLink>
        <NavLink to="/chats" className="main-link">Chats</NavLink>
        <NavLink to="/chatbot" className="main-link">Chatbot</NavLink>
        <NavLink to="/coping-hub" className="main-link">Coping Hub</NavLink>
        <NavLink to="/assessments" className="main-link">Assessments</NavLink>
        <NavLink to="/settings" className="main-link">Settings</NavLink>
        </nav>

                <button
          onClick={() => signOut(auth)}
          style={{
            marginTop: "auto",
            padding: "0.75rem",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Log out
        </button>

        {userData && (
          <div className="sidebar-user">
            <img
              src={userData.profileImageUrl || "/avatar.jpg"}
              alt="User"
            />
            <span>{userData.profileDisplayName || userData.username}</span>
          </div>
        )}
      </aside>

      {/* NESTED CONTENT (Settings / Others) */}
      <Outlet />
    </div>
  );
}
