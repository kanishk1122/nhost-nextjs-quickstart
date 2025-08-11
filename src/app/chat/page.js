"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { nhost } from "../../lib/nhost";

// Graphite sendMessage mutation
const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage(
    $sessionID: String!
    $message: String!
    $prevMessageID: String!
  ) {
    graphite {
      sendMessage(
        sessionID: $sessionID
        message: $message
        prevMessageID: $prevMessageID
      ) {
        sessionID
        messages {
          id
          role
          message
          createdAt
        }
      }
    }
  }
`;

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = nhost.auth.getAuthenticationStatus();
  const sessionID = searchParams.get("id");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE_MUTATION);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <div>Please sign in to view this chat.</div>;
  }

  const handleSend = async () => {
    if (!input || !sessionID) return;
    const { data } = await sendMessage({
      variables: {
        sessionID,
        message: input,
        prevMessageID: "",
      },
    });
    setInput("");
    setMessages(data?.graphite?.sendMessage?.messages || []);
  };

  return (
    <div>
      <h2>Chat</h2>
      <div
        style={{
          minHeight: 200,
          border: "1px solid #ccc",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <b>{msg.role === "user" ? "You" : "Bot"}:</b> {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message"
        style={{ width: "calc(100% - 100px)", marginRight: 10 }}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
