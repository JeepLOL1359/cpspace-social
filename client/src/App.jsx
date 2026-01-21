import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import AuthGate from "./auth/AuthGate";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function handleSignOut() {
    await signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    // Also centering the loading text for consistency
    return <div style={styles.center}><p>Loading...</p></div>;
  }

  if (!user) {
    return (
      <div style={styles.center}>
        <AuthGate onAuth={setUser} />
      </div>
    );
  }

  return (
    <div style={styles.center}>
      <div style={styles.contentCard}>
        <h1>CPSpace</h1>
        <p>Logged in as UID: <strong>{user.uid}</strong></p>

        <p>This is where Diary / Social / DM will live.</p>

        <div style={styles.actions}>
          <button onClick={handleSignOut} style={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  center: {
    minHeight: "100vh",
    width: "100vw", // Ensures horizontal span
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui",
  },
  contentCard: {
    textAlign: "center", // Centers the text inside the card
    padding: "2rem",
    border: "1px solid #ddd",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    maxWidth: "400px",
    width: "90%", // Responsive for mobile
  },
  actions: {
    marginTop: "2rem",
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  signOutBtn: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
    background: "#ff4444",
    color: "white",
    border: "none",
    borderRadius: "4px",
  }
};

export default App;
