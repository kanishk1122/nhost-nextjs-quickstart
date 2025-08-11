"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { gql, useSubscription, useMutation } from "@apollo/client";
import { useAuthenticated } from "@nhost/react";

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

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($chatId: uuid!, $content: String!) {
    insert_messages_one(
      object: { chat_id: $chatId, content: $content, sender: "user" }
    ) {
      id
    }
  }
`;

const SEND_MESSAGE_ACTION = gql`
  mutation SendMessageAction($chatId: uuid!, $content: String!) {
    sendMessage(chat_id: $chatId, content: $content) {
      reply
    }
  }
`;

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthenticated();
  const chatId = searchParams.get("id");
  const { data } = useSubscription(MESSAGES_SUB, {
    variables: { chatId },
    skip: !chatId,
  });
  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION);
  const [sendMessageAction] = useMutation(SEND_MESSAGE_ACTION);
  const [input, setInput] = useState("");
  const [botReply, setBotReply] = useState("");

  if (!isAuthenticated) {
    return <div>Please sign in to view this chat.</div>;
  }

  const handleSend = async () => {
    if (!input) return;
    await sendMessage({ variables: { chatId, content: input } });
    setInput("");
    // Call Hasura Action to trigger chatbot
    const { data: actionData } = await sendMessageAction({
      variables: { chatId, content: input },
    });
    setBotReply(actionData?.sendMessage?.reply || "");
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
