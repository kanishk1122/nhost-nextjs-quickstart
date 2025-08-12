"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { nhost } from "../../lib/nhost";

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Skeleton style={{ height: "3rem", width: "25%" }} />
        <Card style={{ marginTop: "1rem", flexGrow: 1 }}>
          <CardHeader>
            <Skeleton style={{ height: "2rem", width: "50%" }} />
          </CardHeader>
          <CardContent style={{ padding: "1rem" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <Skeleton style={{ height: "4rem", width: "100%" }} />
              <Skeleton style={{ height: "4rem", width: "100%" }} />
              <Skeleton style={{ height: "4rem", width: "100%" }} />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton style={{ height: "2.5rem", width: "100%" }} />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card style={{ borderColor: "rgb(239, 68, 68)" }}>
          <CardHeader style={{ padding: "1.5rem 1.5rem 0" }}>
            <CardTitle style={{ color: "rgb(239, 68, 68)" }}>
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: "1.5rem" }}>
            <p>Please sign in to view this chat.</p>
          </CardContent>
          <CardFooter style={{ padding: "0 1.5rem 1.5rem" }}>
            <Button variant="outline" onClick={() => router.push("/signin")}>
              Go to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card>
          <CardContent style={{ padding: "2rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  animation: "spin 1s linear infinite",
                  height: "1.5rem",
                  width: "1.5rem",
                  border: "4px solid",
                  borderColor: "hsl(222.2 47.4% 11.2%)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              ></div>
              <p>Creating chat...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
      <div
        style={{
          height: "100vh",
          width: "100%",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error creating chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
              {createChatError.message}
            </pre>
            <p className="mt-4">
              Please check Hasura permissions for the <b>user</b> role on the{" "}
              <b>chats</b> table.
              <br />
              The <code className="bg-muted p-1 rounded">
                insert_chats_one
              </code>{" "}
              mutation must be enabled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Card
        style={{
          border: "none",
          boxShadow: "none",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        <CardHeader
          style={{
            backgroundColor: "rgba(var(--primary), 0.05)",
            padding: "1rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent
          style={{
            padding: "1rem",
            flexGrow: 1,
            overflowY: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              overflowY: "auto",
              padding: "0.5rem",
              height: "100%",
            }}
          >
            {messagesData?.messages?.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "gray",
                  padding: "2rem 0",
                }}
              >
                No messages yet. Start the conversation!
              </div>
            ) : (
              messagesData?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    justifyContent:
                      msg.sender === "user" ? "flex-end" : "flex-start",
                    marginBottom: "0.75rem",
                  }}
                >
                  {msg.sender !== "user" && (
                    <Avatar style={{ height: "2rem", width: "2rem" }}>
                      <AvatarImage src="/bot-avatar.png" alt="Bot" />
                      <AvatarFallback
                        style={{ backgroundColor: "rgba(var(--primary), 0.2)" }}
                      >
                        BOT
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      maxWidth: "80%",
                      backgroundColor:
                        msg.sender === "user"
                          ? "hsl(222.2 47.4% 11.2%)"
                          : "hsl(210, 40%, 96.1%)",
                      color: msg.sender === "user" ? "white" : "inherit",
                      borderTopRightRadius:
                        msg.sender === "user" ? 0 : "0.5rem",
                      borderTopLeftRadius: msg.sender !== "user" ? 0 : "0.5rem",
                    }}
                  >
                    <div>{msg.content}</div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.7,
                        textAlign: "right",
                        marginTop: "0.25rem",
                      }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {msg.sender === "user" && (
                    <Avatar style={{ height: "2rem", width: "2rem" }}>
                      <AvatarImage src="/user-avatar.png" alt="User" />
                      <AvatarFallback
                        style={{
                          backgroundColor: "rgba(var(--secondary), 0.2)",
                        }}
                      >
                        YOU
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: "1rem",
            display: "flex",
            gap: "1rem",
            backgroundColor: "rgba(0, 0, 0, 0.02)",
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            style={{ flexGrow: 1, height: "2.5rem" }}
            onKeyPress={(e) =>
              e.key === "Enter" && !loading && input && handleSend()
            }
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input}
            style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    animation: "spin 1s linear infinite",
                    height: "1rem",
                    width: "1rem",
                    border: "2px solid currentColor",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                  }}
                ></div>
                <span>Sending</span>
              </div>
            ) : (
              "Send"
            )}
          </Button>
        </CardFooter>
      </Card>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
