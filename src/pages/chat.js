import { useRouter } from "next/router";
import { useState } from "react";
import { gql, useSubscription, useMutation } from "@apollo/client";
import { nhost } from "../lib/nhost";

const MESSAGES_SUB = gql`
  subscription ChatMessages($chatId: uuid!) {
    messages(
      where: { chat_id: { _eq: $chatId } }
      order_by: { created_at: asc }
    ) {
      id
      content
      sender
      created_at
    }
  }
`;

const SEND_MESSAGE_ACTION = gql`
  mutation SendMessageAction($chatId: uuid!, $content: String!) {
    sendMessage(chat_id: $chatId, content: $content) {
      bot_reply
    }
  }
`;

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = nhost.auth.getAuthenticationStatus();
  const chatId = router.query.id;
  const { data } = useSubscription(MESSAGES_SUB, {
    variables: { chatId },
    skip: !chatId,
  });
  const [sendMessageAction] = useMutation(SEND_MESSAGE_ACTION);
  const [input, setInput] = useState("");
  const [botReply, setBotReply] = useState("");

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <div>Please sign in to view this chat.</div>;
  }

  const handleSend = async () => {
    if (!input) return;
    // Only call Hasura Action for sending message
    const { data: actionData } = await sendMessageAction({
      variables: { chatId, content: input },
    });
    setInput("");
    setBotReply(actionData?.sendMessage?.bot_reply || "");
  };

  return (
    <div>
      <h2>Chat</h2>
      <div style={{ minHeight: 200, border: "1px solid #ccc", padding: 10 }}>
        {data?.messages.map((msg) => (
          <div key={msg.id}>
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.content}
          </div>
        ))}
        {botReply && (
          <div>
            <b>Bot:</b> {botReply}
          </div>
        )}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
