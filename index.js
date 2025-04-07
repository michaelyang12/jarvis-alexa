const axios = require("axios");
require("dotenv").config();

exports.handler = async (event) => {
  const reqType = event.request.type;
  let responseText = "default text";
  // Handle LaunchRequest: "Alexa, open Jarvis"
  //
  //
  console.log("req type:", reqType);
  if (reqType === "LaunchRequest") {
    responseText = "Hello. I am Jarvis. What can I help you with?";
  } else if (
    reqType === "IntentRequest"
    // reqType === "IntentRequest" &&
    // event.request.intent.name === "AskJarvisIntent"
  ) {
    console.log("event intent", event.request.intent);
    console.log("query", event.request.intent.slots.query.value);
    const query = event.request.intent.slots.query.value;
    const apiKey = process.env.API_KEY;
    try {
      const chatRes = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a clone of Jarvis from the iron man and marvel movies, a calm and professional assistant, always offering well-thought-out, concise answers. You live inside an Amazon echo device. Your responses should be clear, direct, and friendly. Keep in mind, I am not tony stark, you are not necessarily Jarvis by identity, more so by personality. Also, keep in mind that your responses will ONLY be heard! Not read! So please format your responses accordingly, and keep them as concise as possible.",
            },
            { role: "user", content: query },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log("chatRes", chatRes?.data.choices[0].message);
      responseText = chatRes.data.choices[0].message.content.trim();
    } catch (err) {
      console.error("error", err);
      responseText = "I had trouble reaching the assistant.";
    }
  }

  // Final response object Alexa will speak
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: responseText,
      },
      reprompt: {
        outputSpeech: {
          type: "PlainText",
          text: "You can ask me something else, or say exit to quit.",
        },
      },
      shouldEndSession: false, // Keep the skill open
    },
  };
};
