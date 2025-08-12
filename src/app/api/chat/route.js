import { Client } from "@gradio/client";
import { NextResponse } from "next/server";

// Initialize the client at module scope (lazy loading)
let gradioClient = null;

// Function to get or create the Gradio client
async function getGradioClient() {
  if (!gradioClient) {
    console.log("Initializing new Gradio client connection...");
    gradioClient = await Client.connect("yuntian-deng/ChatGPT");
  }
  return gradioClient;
}

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { message, chatHistory = [], chatCounter = 1 } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Format chat history for Gradio
    const formattedChatHistory = chatHistory.map((msg) => {
      if (Array.isArray(msg)) {
        return msg;
      }
      return [msg.content, msg.sender === "bot" ? msg.content : null];
    });

    console.log("Processing message:", message);
    console.log("Chat history:", formattedChatHistory);

    // Get client and make prediction
    const client = await getGradioClient();
    const result = await client.predict("/predict", {
      inputs: message,
      top_p: 1,
      temperature: 1,
      chat_counter: chatCounter,
      chatbot: formattedChatHistory.length
        ? formattedChatHistory
        : [["Hello!", null]],
    });

    console.log("Received prediction result");

    // Extract response from result
    const botReply =
      result.data && result.data.length > 0
        ? result.data[result.data.length - 1][1]
        : "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      reply: botReply,
      fullResponse: result.data,
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error.message },
      { status: 500 }
    );
  }
}
