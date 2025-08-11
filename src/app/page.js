"use client";
import { useEffect, useState } from "react";
import { useAuthenticated, useSignIn, useSignUp } from "@nhost/react";
import { gql, useQuery, useMutation } from "@apollo/client";
import ClientProvider from "../components/ClientProvider";
import SignInPage from "./signin/page";

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

export default function Home() {
  const { isAuthenticated } = useAuthenticated();
  const { data, refetch } = useQuery(CHATS_QUERY, { skip: !isAuthenticated });
  const [createChat] = useMutation(CREATE_CHAT_MUTATION);
  const [chatTitle, setChatTitle] = useState("");

  if (!isAuthenticated) {
    // Use the sign-in component
    return <SignInPage />;
  }

  const handleCreateChat = async () => {
    if (!chatTitle) return;
    await createChat({ variables: { title: chatTitle } });
    setChatTitle("");
    refetch();
  };

  return (
    <ClientProvider>
      <div>
        <h1>Your Chats</h1>
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
    </ClientProvider>
  );
}
