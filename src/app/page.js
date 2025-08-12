"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { nhost } from "../lib/nhost";
import { Button } from "@/components/ui/button";
import { gql, useQuery, useMutation } from "@apollo/client";
import ClientProvider from "../components/ClientProvider";
import SignInPage from "./signin/page";

// Inner component that uses useSearchParams
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = nhost.auth.getAuthenticationStatus();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If user is already authenticated, redirect to chat
      router.push("/chat");
    }
  }, [isLoading, isAuthenticated, router]);

  const { data, refetch } = useQuery(CHATS_QUERY, { skip: !isAuthenticated });
  const [createChat] = useMutation(CREATE_CHAT_MUTATION);
  const [chatTitle, setChatTitle] = useState("");

  const handleCreateChat = async () => {
    if (!chatTitle) return;
    await createChat({ variables: { title: chatTitle } });
    setChatTitle("");
    refetch();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Nhost Chat</h1>
        <p className="text-xl mb-8">
          A real-time chat application with AI-powered responses
        </p>
        <div className="flex flex-col space-y-4">
          <Button
            onClick={() => router.push("/signin")}
            className="w-full h-12 text-lg"
          >
            Sign In
          </Button>
          <Button
            onClick={() => router.push("/signup")}
            variant="outline"
            className="w-full h-12 text-lg"
          >
            Sign Up
          </Button>
        </div>
        {isAuthenticated && (
          <div>
            <h2>Your Chats</h2>
            <ul>
              {data?.chats.map((chat) => (
                <li key={chat.id}>
                  <a href={`/chat?id=${chat.id}`}>{chat.title}</a>
                </li>
              ))}
            </ul>
            <input
              type="text"
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              placeholder="New chat title"
            />
            <button onClick={handleCreateChat}>Create Chat</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="h-12 w-12 border-4 border-t-transparent border-gray-300 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

const CHATS_QUERY = gql`
  query MyChats {
    chats {
      id
      title
    }
  }
`;

const CREATE_CHAT_MUTATION = gql`
  mutation CreateChat($title: String!) {
    insert_chats_one(object: { title: $title }) {
      id
      title
    }
  }
`;
