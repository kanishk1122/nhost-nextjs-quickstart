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
    // Parse request body with better error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing JSON request:", parseError);

      // Log the request details for debugging
      const text = await request
        .text()
        .catch((e) => "Could not get request text");
      console.error("Raw request body:", text);

      return NextResponse.json(
        { error: "Invalid JSON in request body", details: parseError.message },
        { status: 400 }
      );
    }

    const { message, chatHistory = [], chatCounter = 1 } = body || {};

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

    console.log("Received prediction result:", JSON.stringify(result.data));

    // Extract response from result - getting the LAST response instead of the first
    let botReply = "Sorry, I couldn't generate a response.";

    // Based on your response structure, getting the LAST message-response pair
    if (
      result.data &&
      Array.isArray(result.data) &&
      result.data.length > 0 &&
      Array.isArray(result.data[0]) &&
      result.data[0].length > 0
    ) {
      // Get the last message-response pair from the array
      const lastPair = result.data[0][result.data[0].length - 1];

      // Extract the response (second element in the pair)
      if (Array.isArray(lastPair) && lastPair.length > 1) {
        botReply = lastPair[1];
      }
    }

    console.log("Extracted bot reply (latest):", botReply);

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
