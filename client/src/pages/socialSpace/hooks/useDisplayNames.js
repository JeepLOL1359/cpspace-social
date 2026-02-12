import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../firebaseConfig";

export function useDisplayNames(posts) {
  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  const [map, setMap] = useState({});

  useEffect(() => {
    if (!currentUid || posts.length === 0) return;

    async function load() {
      // 1️⃣ Fetch conversations involving me
      const convoQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUid)
      );

      const convoSnap = await getDocs(convoQuery);

      const consentedSet = new Set();

      convoSnap.docs.forEach(d => {
        const data = d.data();
        const other = data.participants.find(p => p !== currentUid);

        if (data.relationshipStatus === "consented") {
          consentedSet.add(other);
        }
      });

      // 2️⃣ Collect unique authorIds in current posts
      const authorIds = [
        ...new Set(posts.map(p => p.authorId))
      ];

      const result = {};

      for (const uid of authorIds) {
        // 3️⃣ Always fetch pseudonym
        const publicSnap = await getDocs(
          collection(db, "users", uid, "publicProfile")
        );

        let pseudonym = "Anonymous";

        publicSnap.forEach(p => {
          const data = p.data();
          if (data?.pseudonym) {
            pseudonym = data.pseudonym;
          }
        });

        // 4️⃣ If consented → fetch username
        if (consentedSet.has(uid)) {
          const userSnap = await getDoc(
            doc(db, "users", uid)
          );

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const username = userData.username;

            if (username?.value && username?.discriminator) {
              result[uid] =
                username.value +
                "#" +
                username.discriminator;
              continue;
            }
          }
        }

        result[uid] = pseudonym;
      }

      setMap(result);
    }

    load();
  }, [posts, currentUid]);

  return map;
}
