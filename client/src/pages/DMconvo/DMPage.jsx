/* src/pages/DMconvo/DMPage.jsx */

import { useState } from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import "./dm.css";

export default function DMPage() {
  const [selectedConvo, setSelectedConvo] = useState(null);

  return (
    <div className="dm-layout">
      <ConversationList
        selected={selectedConvo}
        onSelect={setSelectedConvo}
      />

      <ChatWindow conversation={selectedConvo} />
    </div>
  );
}
