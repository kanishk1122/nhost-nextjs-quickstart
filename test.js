import { Client } from "@gradio/client";

async function runPrediction() {
    try {
        // Connect to the Gradio Space client
        const client = await Client.connect("yuntian-deng/ChatGPT");

        // Call the /predict API with inputs (matching your axios payload)
        const result = await client.predict("/predict", {
            inputs: "Hello!!",
            top_p: 1,
            temperature: 1,
            chat_counter: 3,
            chatbot: [["Hello!", null]],
        });

        console.log("Prediction result:", result.data);
    } catch (err) {
        console.error("Error calling Gradio client:", err);
    }
}

runPrediction();
