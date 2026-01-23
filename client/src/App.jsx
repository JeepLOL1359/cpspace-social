import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, sendEmailVerification, signOut } from "firebase/auth";

import MainLayout from "./pages/mainLayout";
import AuthGate from "./auth/AuthGate";
import "./App.css";

import SettingsLayout from "./pages/settings/settingsLayout";

import Profile from "./pages/settings/profile";
import Preferences from "./pages/settings/preferences";
import About from "./pages/settings/about";
import Help from "./pages/settings/help";

function App() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cooldown state (seconds)
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await u.reload();
        setUser(auth.currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [auth]);

  // Handle the countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    try {
      await sendEmailVerification(user);
      setCountdown(60); // Set 60 seconds cooldown
      alert("Verification email sent!");
    } catch (error) {
      if (error.code === "auth/too-many-requests") {
        alert("Too many requests. Please wait a moment.");
        setCountdown(120); // Longer wait if Firebase blocks us
      } else {
        console.error(error);
      }
    }
  };

  const handleRefresh = async () => {
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  };

  if (loading) return null;
  if (!user) return <AuthGate />;

  if (!user.emailVerified) {
    return (
      <div className="verifyWrapper">
        <div className="verifyCard">
          <h2>Please verify your email</h2>
          <p>A verification email has been sent to <b>{user.email}</b>.</p>

          <div className="verifyActions">
            <button 
              className={`primary-btn ${countdown > 0 ? "disabled-btn" : ""}`} 
              onClick={handleResendEmail}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
            </button>
            
            <button className="verified-btn" onClick={handleRefresh}>
              I've Verified
            </button>
            
            <button className="secondary-btn" onClick={() => signOut(auth)}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

    return (
    <BrowserRouter>
      <Routes>
        {/* MAIN APP */}
        <Route path="/" element={<MainLayout />}>
          
          {/* SETTINGS */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Profile />} />   {/* /settings */}
            <Route path="profile" element={<Profile />} />
            <Route path="preferences" element={<Preferences />} />
            <Route path="about" element={<About />} />
            <Route path="help" element={<Help />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;