"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { nhost } from "../../lib/nhost";

const CREATE_CHAT_MUTATION = gql(`
  mutation CreateChat($user_id: uuid!) {
    insert_chats_one(object: { user_id: $user_id }) {
      id
      user_id
      created_at
    }
  }
`);

const SEND_MESSAGE_MUTATION = gql(`
  mutation SendMessage($chat_id: uuid!, $content: String!, $sender: String!) {
    insert_messages(
      objects: {
        chat_id: $chat_id
        content: $content
        sender: $sender
      }
    ) {
      returning {
        id
        content
        sender
        created_at
      }
    }
  }
`);

const GET_MESSAGES_QUERY = gql(`
  query GetMessages($chatId: uuid!) {
    messages(where: { chat_id: { _eq: $chatId } }, order_by: { created_at: asc }) {
      id
      content
      sender
      created_at
    }
  }
`);

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = nhost.auth.getAuthenticationStatus();
  const userId = nhost.auth.getUser()?.id;
  const chatId = searchParams.get("id");
  const [input, setInput] = useState("");
  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE_MUTATION);
  const [createChat, { error: createChatError }] =
    useMutation(CREATE_CHAT_MUTATION);
  const [getMessages, { data: messagesData, refetch }] =
    useLazyQuery(GET_MESSAGES_QUERY);

  useEffect(() => {
    if (!chatId && userId) {
      (async () => {
        try {
          const { data } = await createChat({ variables: { user_id: userId } });
          const newChatId = data?.insert_chats_one?.id;
          if (newChatId) {
            router.replace(`/chat?id=${newChatId}`);
          }
        } catch (err) {
          // Error will be handled below
          console.error("Error creating chat:", err);
        }
      })();
    }
    if (chatId) {
      getMessages({ variables: { chatId } });
    }
  }, [chatId, userId, createChat, router, getMessages]);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <div>Please sign in to view this chat.</div>;
  }
  if (!chatId) {
    return <div>Creating chat...</div>;
  }

  const handleSend = async () => {
    if (!input || !chatId) return;
    await sendMessage({
      variables: {
        chat_id: chatId,
        content: input,
        sender: "user",
      },
    });
    setInput("");
    // Refetch messages after sending
    if (refetch) refetch();
  };

  if (createChatError) {
    return (
      <div>
        <h2>Error creating chat</h2>
        <pre>{createChatError.message}</pre>
        <p>
          Please check Hasura permissions for the <b>user</b> role on the{" "}
          <b>chats</b> table.
          <br />
          The <code>insert_chats_one</code> mutation must be enabled.
        </p>
      </div>
    );
  }

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
        {messagesData?.messages?.map((msg) => (
          <div key={msg.id}>
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.content}
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
