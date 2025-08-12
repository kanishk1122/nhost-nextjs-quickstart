"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { nhost } from "../../lib/nhost";
// import Sidebar from "./sidebar";
import { useQuery } from "@apollo/client";
import { PlusCircle } from "lucide-react";

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
import { Menu, X } from "lucide-react";

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

// Update the function to call n8n webhook with POST request
async function callN8nWebhook(chatId, recentMessages, messagefromUser) {
  try {
    // Extract the user's last message (the one they just sent)
    const userMessage = messagefromUser;

    // Format chat history as pairs of [user message, bot response]
    const formattedChatHistory = [];

    // Start from earlier messages and build conversation history
    for (let i = 0; i < recentMessages.length - 1; i++) {
      if (
        recentMessages[i].sender === "user" &&
        i + 1 < recentMessages.length &&
        recentMessages[i + 1].sender === "bot"
      ) {
        formattedChatHistory.push([
          recentMessages[i].content,
          recentMessages[i + 1].content,
        ]);
      }
    }

    // Add the latest user message with null response (since we're waiting for response)
    if (
      recentMessages.length > 0 &&
      recentMessages[recentMessages.length - 1].sender === "user"
    ) {
      formattedChatHistory.push([
        recentMessages[recentMessages.length - 1].content,
        null,
      ]);
    }

    // Create request body as specified
    const requestBody = {
      message: userMessage,
      formattedChatHistory: formattedChatHistory,
    };

    console.log("Sending webhook request:", JSON.stringify(requestBody));

    // Call the n8n webhook with POST - fixed to avoid btoa during SSR
    const username = "kanishk";
    const password = "kanishk";

    // Only use btoa in the browser environment
    let authHeader;
    if (typeof window !== "undefined") {
      // Client-side only
      authHeader = `Basic ${btoa(`${username}:${password}`)}`;
    } else {
      // Simple fallback for server-side
      authHeader = `Basic a2FuaXNoazprYW5pc2hr`; // pre-encoded "kanishk:kanishk"
    }

    const response = await fetch(
      `https://kanishk112221.app.n8n.cloud/webhook/6f208eb9-4e10-4935-a1d0-50a5dbbd5977`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`N8n webhook returned ${response.status}`);
    }

    const data = await response.json();
    console.log("N8n response:", data);

    // Specifically extract the 'reply' field as shown in the example response
    if (data && data.reply) {
      return data.reply;
    } else if (
      data &&
      data.fullResponse &&
      data.fullResponse[0] &&
      Array.isArray(data.fullResponse[0]) &&
      data.fullResponse[0].length > 0 &&
      data.fullResponse[0][data.fullResponse[0].length - 1] &&
      data.fullResponse[0][data.fullResponse[0].length - 1][1]
    ) {
      // Extract from fullResponse as fallback
      return data.fullResponse[0][data.fullResponse[0].length - 1][1];
    }

    return "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error calling n8n webhook:", error);
    return "Sorry, there was an error generating a response.";
  }
}

// Fix main page component to avoid hydration errors
export default function ChatPage() {
  // Use useEffect to control client-side rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return a simple loading state until client-side rendering is ready
  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="h-8 w-8 border-4 border-t-transparent border-gray-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Card className="p-8 text-center">
            <CardContent>
              <div className="mb-4">
                <div className="h-8 w-8 border-4 border-t-transparent border-gray-300 rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading chat...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

// Query to get all user's chats with preview of messages
const GET_USER_CHATS = gql`
  query GetUserChats($userId: uuid!) {
    chats(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      id
      created_at
      messages(limit: 1, order_by: { created_at: desc }) {
        id
        content
        sender
        created_at
      }
    }
  }
`;

function Sidebar({ currentChatId, onSelectChat, onClose }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const userId = isMounted ? nhost.auth.getUser()?.id : null;

  // Ensure component is mounted before using browser APIs
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Improved query configuration to ensure data loads on component mount
  const { data, loading, error, refetch } = useQuery(GET_USER_CHATS, {
    variables: { userId },
    skip: !userId || !isMounted,
    fetchPolicy: "cache-and-network", // Gets fresh data while showing cached data immediately
    nextFetchPolicy: "network-only", // Ensures subsequent fetches always go to network
    pollInterval: 15000, // Poll every 15 seconds to keep chat list updated
    notifyOnNetworkStatusChange: true, // Shows loading state during refetches
  });

  // Force an immediate refetch when component mounts and userId is available
  useEffect(() => {
    let mounted = true;

    if (userId && isMounted && mounted) {
      console.log("Fetching chat list for user:", userId);
      refetch().catch((err) => {
        console.error("Error fetching chat list:", err);
      });
    }

    return () => {
      mounted = false;
    };
  }, [userId, isMounted, refetch]);

  // Also refetch when currentChatId changes to keep sidebar in sync with active chat
  useEffect(() => {
    if (userId && isMounted && currentChatId) {
      refetch();
    }
  }, [currentChatId, userId, isMounted, refetch]);

  const [createChat, { loading: createLoading }] =
    useMutation(CREATE_CHAT_MUTATION);

  // Refresh chat list when component mounts
  useEffect(() => {
    if (userId && isMounted) {
      refetch();
    }
  }, [userId, refetch, isMounted]);

  // Don't render anything during SSR or initial render
  if (!isMounted) {
    return (
      <div className="bg-gray-50 h-full flex flex-col p-4">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded w-full"></div>
          <div className="h-16 bg-gray-200 rounded w-full"></div>
          <div className="h-16 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const handleCreateNewChat = async () => {
    if (!userId) return;
    try {
      const { data } = await createChat({ variables: { user_id: userId } });
      const newChatId = data?.insert_chats_one?.id;
      if (newChatId) {
        // Navigate to the new chat
        router.push(`/chat?id=${newChatId}`);
        if (onClose) onClose(); // Close sidebar on mobile
      }
    } catch (err) {
      console.error("Error creating new chat:", err);
    }
  };

  const handleSelectChat = (chatId) => {
    router.push(`/chat?id=${chatId}`);
    if (onSelectChat) onSelectChat(chatId);
    if (onClose) onClose(); // Close sidebar on mobile
  };

  // Get a preview of the chat from messages
  const getChatPreview = (chat) => {
    if (!chat.messages?.length) return "New conversation";

    // Find first message (user or bot)
    const lastMessage = chat.messages[0];
    return lastMessage?.content?.length > 40
      ? lastMessage.content.substring(0, 40) + "..."
      : lastMessage.content;
  };

  if (!nhost.auth.getAuthenticationStatus().isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-gray-500">
        Please sign in to view your chats
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b flex justify-between items-center bg-white"
      style={{ borderBottom: "1px solid #eee" }}
      >
        <h2 className="font-semibold text-lg">Your Conversations</h2>
        <Button
          onClick={handleCreateNewChat}
          disabled={createLoading}
          variant="outline"
          style={{ padding: "0.5rem 1rem", margin: "0.5rem 0" }}
          size="sm"
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-16 rounded-md" />
            <Skeleton className="h-16 rounded-md" />
            <Skeleton className="h-16 rounded-md" />
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">
            Error loading chats
          </div>
        ) : data?.chats?.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p className="mb-4">No conversations yet</p>
            <Button onClick={handleCreateNewChat} disabled={createLoading}>
              Start a new chat
            </Button>
          </div>
        ) : (
          <div className="space-y-2 p-1">
            {data?.chats &&
              data.chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    chat.id === currentChatId
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                  style={{padding: "0.5rem 1rem" , margin: "0.5rem 0"}}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-gray-500">
                      {new Date(chat.created_at).toLocaleDateString()}
                    </span>
                    {chat.id === currentChatId && (
                      <span className="text-xs font-medium text-blue-600">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1 line-clamp-2 text-gray-700">
                    {getChatPreview(chat)}
                  </p>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Fix the btoa function which causes hydration errors (not available during SSR)
function ChatContent() {
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
  const [showSidebar, setShowSidebar] = useState(false);

  // Modified useEffect to not create a chat automatically
  useEffect(() => {
    // Only fetch messages if a chatId exists
    if (chatId) {
      getMessages({ variables: { chatId } });
    }
  }, [chatId, getMessages]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to view this chat.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/signin")}>
              Go to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Handle sending a message - create a chat if needed
  const handleSend = async () => {
    if (!input || (!chatId && !userId)) return;

    try {
      // Create a new chat if none exists
      let activeChatId = chatId;

      if (!activeChatId) {
        // Only create a chat when user sends first message
        const { data } = await createChat({ variables: { user_id: userId } });
        activeChatId = data?.insert_chats_one?.id;

        if (activeChatId) {
          // Update URL with new chat ID
          router.replace(`/chat?id=${activeChatId}`);
        } else {
          throw new Error("Failed to create new chat");
        }
      }

      // Save user message
      await sendMessage({
        variables: {
          chat_id: activeChatId,
          content: input,
          sender: "user",
        },
      });

      setInput("");

      // Refetch messages to include the new user message
      await refetch();

      // Get messages for the chat
      const allMessages = messagesData?.messages || [];

      // Call n8n webhook with all messages
      const botResponse = await callN8nWebhook(
        activeChatId,
        allMessages,
        input
      );

      // Save bot response
      await sendMessage({
        variables: {
          chat_id: activeChatId,
          content: botResponse,
          sender: "bot",
        },
      });

      // Refetch messages to show the bot response
      refetch();
    } catch (error) {
      console.error("Error in send message flow:", error);
    }
  };

  // Show a "start a conversation" UI when no chat is selected
  if (!chatId) {
    return (
      <div className="h-screen flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-80 h-full">
          <Sidebar currentChatId={chatId} />
        </div>

        {/* Mobile sidebar toggle */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
            <div className="w-80 h-full bg-white relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setShowSidebar(false)}
              >
                <X size={20} />
              </Button>
              <Sidebar
                currentChatId={chatId}
                onClose={() => setShowSidebar(false)}
              />
            </div>
          </div>
        )}

        {/* Main content - new conversation UI */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b p-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setShowSidebar(true)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-semibold">New Conversation</h1>
          </header>

          <div className="flex-1 flex flex-col justify-center items-center p-8">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold mb-4">Start a new chat</h2>
              <p className="text-gray-600 mb-6">
                Send a message below to begin your conversation
              </p>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim() && !loading) handleSend();
                  }}
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message to start..."
                    className="flex-1"
                    style={{ padding: "12px 16px" }}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{ padding: "12px 16px" }}
                  >
                    {loading ? "Starting..." : "Start Chat"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Desktop sidebar - always visible on larger screens */}
      <div className="hidden md:block w-80 h-full">
        <Sidebar currentChatId={chatId} />
      </div>

      {/* Mobile sidebar - shows/hides based on state */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="w-80 h-full bg-white relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setShowSidebar(false)}
            >
              <X size={20} />
            </Button>
            <Sidebar
              currentChatId={chatId}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        </div>
      )}

      {/* Main chat content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={20} />
          </Button>
          <h1 className="text-xl font-semibold">Chat</h1>
        </header>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messagesData?.messages?.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messagesData?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                  style={{ margin: "8px 20px" }}
                >
                  {msg.sender !== "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/bot-avatar.png" alt="Bot" />
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                        BOT
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[75%] ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-gray-100 rounded-tl-none"
                    }`}
                    style={{ padding: "12px 16px", margin: "8px 0" }}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                    <div className="text-xs opacity-70 text-right mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {msg.sender === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/user-avatar.png" alt="User" />
                      <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                        YOU
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message input */}
        <div
          className="border-t bg-gray-50 p-4"
          style={{ padding: "12px 16px" }}
        >
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && !loading) handleSend();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              style={{ padding: "12px 16px", marginRight: "8px" }}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              style={{ padding: "12px 16px" }}
            >
              {loading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
