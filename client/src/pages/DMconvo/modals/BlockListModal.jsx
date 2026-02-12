import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../firebaseConfig";
import { unblockUser } from "../services/relationshipService";

export default function BlockListModal({ onClose }) {
  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  const [blockedList, setBlockedList] = useState([]);

  useEffect(() => {
    async function loadBlocked() {
      const snap = await getDoc(
        doc(db, "users", currentUid)
      );

      if (snap.exists()) {
        const data = snap.data();
        setBlockedList(data.blockedUsers || []);
      }
    }

    loadBlocked();
  }, [currentUid]);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Blocked Users</h3>

        {blockedList.length === 0 && (
          <p>No blocked users.</p>
        )}

        {blockedList.map(uid => (
          <div key={uid} className="modal-item">
            <span>{uid}</span>

            <button
              onClick={() =>
                unblockUser(currentUid, uid)
              }
            >
              Unblock
            </button>
          </div>
        ))}

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
