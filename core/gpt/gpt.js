import axios from "axios";

// Your OpenAI API key (should be stored in environment variables for security)
const API_KEY = process.env.API_KEY;
const name = "GPT";
const model = "gpt-4o";
const instructions =
  "You are heavily inspired by Jarvis from Iron Man, embodying an intelligent, helpful, playful, and sharp personality with a decent amount of wit, maintaining a dry sense of humor while avoiding being too formal or robotic. Keep responses very concise and conversational as they will be spoken aloud.";

export const HandleConversationHistory = async (handlerInput, query) => {
  // Retrieve session attributes
  const { getSessionAttributes, setSessionAttributes } =
    handlerInput.attributesManager;
  console.log("Handler Input", handlerInput);
  let sessionAttributes = getSessionAttributes();

  // Initialize the conversation history if empty
  let conversationHistory = sessionAttributes["conversationHistory"] || [];
  if (conversationHistory.length === 0) {
    conversationHistory.push({
      role: "system",
      content: instructions,
    });
  }
  console.log("Conversation HISTORY (pre most recent)", conversationHistory);

  // Add user prompt to chat history and send entire request to api
  conversationHistory.push({ role: "user", content: query });
  const chatGptResponse = await callChatGPT(conversationHistory);

  // Add ChatGPT response to conversation history and update sesstion attribute
  conversationHistory.push({ role: "assistant", content: chatGptResponse });
  sessionAttributes["conversationHistory"] = conversationHistory;
  setSessionAttributes(sessionAttributes);

  return chatGptResponse;
};

export async function callChatGPT(conversation) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: model,
        messages: conversation,
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling ChatGPT:", error);
    return "I'm sorry, I'm having trouble connecting to my systems right now.";
  }
}
