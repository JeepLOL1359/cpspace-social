import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import "./profile.css";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newAge, setNewAge] = useState("");
  const [newGender, setNewGender] = useState("");

  const auth = getAuth();
  const fileInputRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setUserData(snap.data());
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Hard limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Please upload an image smaller than 2MB.");
      return;
    }

    setUploading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const imageRef = ref(
        storage,
        `profileImages/${user.uid}/profile_${Date.now()}`
      );

      const uploadTask = uploadBytesResumable(imageRef, file, {
        contentType: file.type,
      });

      await new Promise((resolve, reject) => {
        uploadTask.on("state_changed", null, reject, resolve);
      });

      const downloadURL = await getDownloadURL(imageRef);

      await updateDoc(doc(db, "users", user.uid), {
        profileImageUrl: downloadURL,
      });

      setUserData((prev) => ({
        ...prev,
        profileImageUrl: downloadURL,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startEdit = (field) => {
    setEditingField(field);

    if (field === "name") {
      setNewDisplayName(userData.profileDisplayName || "");
    }
    if (field === "age") {
      setNewAge(userData.age ?? "");
    }
    if (field === "gender") {
      setNewGender(userData.gender ?? "");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const saveDisplayName = async () => {
    if (!newDisplayName.trim()) return;

    setSaving(true);

    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        profileDisplayName: newDisplayName.trim(),
      });

      // Update UI immediately
      setUserData((prev) => ({
        ...prev,
        profileDisplayName: newDisplayName.trim(),
      }));

      setEditingField(null);
    } catch (err) {
      console.error("Failed to update display name", err);
      alert("Failed to update display name");
    } finally {
      setSaving(false);
    }
  };

  const saveAge = async () => {
    const ageNumber = Number(newAge);

    if (!ageNumber || ageNumber < 13 || ageNumber > 120) {
      alert("Please enter a valid age");
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        age: ageNumber,
      });

      setUserData((prev) => ({
        ...prev,
        age: ageNumber,
      }));

      setEditingField(null);
    } catch (err) {
      console.error("Failed to update age", err);
      alert("Failed to update age");
    } finally {
      setSaving(false);
    }
  };

  const formatGender = (gender) => {
    if (!gender || gender === "prefer-not-to-say") return "-";

    switch (gender) {
      case "male":
        return "M";
      case "female":
        return "F";
      default:
        return "-";
    }
  };

  const saveGender = async () => {
    if (!newGender) return;

    setSaving(true);

    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        gender: newGender,
      });

      setUserData((prev) => ({
        ...prev,
        gender: newGender,
      }));

      setEditingField(null);
    } catch (err) {
      console.error("Failed to update gender", err);
      alert("Failed to update gender");
    } finally {
      setSaving(false);
    }
  };

  if (!userData) return <p>Loading profile...</p>;

  return (
    <div className="profile-panel">
      <div className="profile-card">
        <h2>User Profile</h2>

        {/* PROFILE IMAGE */}
        <div className="profile-avatar">
          <img
            src={userData.profileImageUrl || "/avatar.jpg"}
            alt="Profile"
          />

          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Change Photo"}
          </button>

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
        </div>

        {/* PROFILE INFO */}
        <div className="profile-info">
          <div className="profile-row">
            <span>Display Name</span>

            {/* COLUMN 2: VALUE / INPUT */}
            <div className="profile-value">
              {editingField === "name" ? (
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  disabled={saving}
                />
              ) : (
                <p>{userData.profileDisplayName || "-"}</p>
              )}
            </div>

            {/* COLUMN 3: ACTIONS */}
            <div className="profile-action">
              {editingField === "name" ? (
                <>
                  <button onClick={saveDisplayName} disabled={saving}>Save</button>
                  <button onClick={cancelEdit} disabled={saving}>Cancel</button>
                </>
              ) : (
                <button className="edit-btn" onClick={() => startEdit("name")}>✏️</button>
              )}
            </div>
          </div>

          <div className="profile-row">
            <span>Username</span>
            <p>{userData.username}</p>
            <div className="profile-action"></div>
          </div>

          <div className="profile-row">
            <span>Email</span>
            <p>{userData.email}</p>
            <div className="profile-action"></div>
          </div>

          <div className="profile-row">
            <span>Age</span>

            <div className="profile-value">
              {editingField === "age" ? (
                <input
                  type="number"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  disabled={saving}
                />
              ) : (
                <p>{userData.age ?? "-"}</p>
              )}
            </div>

            <div className="profile-action">
              {editingField === "age" ? (
                <>
                  <button onClick={saveAge} disabled={saving}>Save</button>
                  <button onClick={cancelEdit} disabled={saving}>Cancel</button>
                </>
              ) : (
                <button className="edit-btn" onClick={() => startEdit("age")}>✏️</button>
              )}
            </div>
          </div>

          <div className="profile-row">
            <span>Gender</span>

            {/* COLUMN 2: VALUE / SELECT */}
            <div className="profile-value">
              {editingField === "gender" ? (
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  disabled={saving}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              ) : (
                <p>{formatGender(userData.gender)}</p>
              )}
            </div>

            {/* COLUMN 3: ACTIONS */}
            <div className="profile-action">
              {editingField === "gender" ? (
                <>
                  <button onClick={saveGender} disabled={saving}>Save</button>
                  <button onClick={cancelEdit} disabled={saving}>Cancel</button>
                </>
              ) : (
                <button
                  className="edit-btn"
                  onClick={() => startEdit("gender")}
                >
                  ✏️
                </button>
              )}
            </div>
          </div>

          <div className="profile-row">
            <span>Role</span>
            <p>{userData.roles}</p>
            <div className="profile-action"></div>
          </div>
        </div>
      </div>
    </div>
  );
}