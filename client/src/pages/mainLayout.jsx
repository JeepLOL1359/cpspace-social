import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./mainLayout.css";

const COLOR_MAP = {
  blue: { accent: "#60a5fa", soft: "#dbeafe" },
  green: { accent: "#34d399", soft: "#d1fae5" },
  yellow: { accent: "#facc15", soft: "#fef3c7" },
  orange: { accent: "#fb923c", soft: "#ffedd5" },
  pink: { accent: "#f472b6", soft: "#fce7f3" },
};

export default function MainLayout() {
  const auth = getAuth();

  const [userData, setUserData] = useState(null);
  const [ready, setReady] = useState(false);
  const isAdmin = userData?.roles?.includes("admin");
  
  useEffect(() => {
    let unsubUser = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUserData(null);
        setReady(true);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const profileRef = doc(
        db,
        "users",
        user.uid,
        "publicProfile",
        "profile"
      );

      let rootData = null;
      let profileData = null;

      const updateState = () => {
        if (!rootData || !profileData) return;

        const combined = {
          ...rootData,
          publicProfile: profileData,
        };

        console.log("🔥 Sidebar user update:", combined);
        setUserData(combined);

        const p = rootData.preferences;
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

        setReady(true);
      };

      const unsubRoot = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) return;
        rootData = snap.data();
        updateState();
      });

      const unsubProfile = onSnapshot(profileRef, (snap) => {
        if (!snap.exists()) return;
        profileData = snap.data();
        updateState();
      });

      unsubUser = () => {
        unsubRoot();
        unsubProfile();
      };
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, [auth]);

  if (!ready) return null;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar main-sidebar">
        <div className="logo">CPSPACE</div>

        <nav>
          <NavLink to="/diary" className="main-link">Diary</NavLink>
          <NavLink to="/social-space" className="main-link">Social Space</NavLink>
          <NavLink to="/chats" className="main-link">Chats</NavLink>
          <NavLink to="/chatbot" className="main-link">Chatbot</NavLink>
          <NavLink to="/coping-hub" className="main-link">Coping Hub</NavLink>
          <NavLink to="/assessments" className="main-link">Assessments</NavLink>
          <NavLink to="/settings" className="main-link">Settings</NavLink>

          {isAdmin && (
            <NavLink to="/admin/strategies" className="main-link">
              Manage Strategies
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/moderation" className="main-link">
              Moderation Panel
            </NavLink>
          )}
        </nav>

        <button
          onClick={() => signOut(auth)}
          style={{
            marginTop: "155px",
            padding: "0.75rem",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          Log out
        </button>

        {/* USER INFO */}
        {userData && (
          <div className="sidebar-user">
            <img
              src={userData.profileImageUrl || "/avatar.jpg"}
              alt="User"
              referrerPolicy="no-referrer"
            />
            <span>
              {userData.publicProfile?.pseudonym ||
                `${userData.publicProfile?.username?.value}#${userData.publicProfile?.username?.discriminator}`}
            </span>
          </div>
        )}
      </aside>

      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}