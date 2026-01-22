import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import MainLayout from "./pages/mainLayout";
import AuthGate from "./auth/AuthGate";
import { sendEmailVerification } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (!user) {
    return <AuthGate />;
  }

  if (user && !user.emailVerified) {
    return (
      <div style={styles.verifyWrapper}>
        <h2>Please verify your email</h2>
        <p>
          A verification email has been sent to <b>{user.email}</b>.
        </p>

        <button onClick={() => sendEmailVerification(user)}>
          Resend verification email
        </button>

        <button onClick={() => signOut(auth)}>
          Sign out
        </button>
      </div>
    );
  }


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
