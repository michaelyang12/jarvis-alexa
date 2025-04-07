// Import required modules
const Alexa = require("ask-sdk-core");
const axios = require("axios");

// Your OpenAI API key (should be stored in environment variables for security)
const API_KEY = process.env.API_KEY;
const name = "GPT";
const model = "gpt-4o";
const instructions =
  "You are heavily inspired by Jarvis from Iron Man, embodying an intelligent, helpful, playful, and sharp personality with a decent amount of wit, maintaining a dry sense of humor while avoiding being too formal or robotic. Keep responses very concise and conversational as they will be spoken aloud.";

// Helper function for calling ChatGPT API
async function callChatGPT(conversation) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: model,
        messages: conversation,
        // {
        //   role: "system",
        //   content:
        //     "You are J.A.R.V.I.S. the AI assistant from Iron Man. Keep responses concise and conversational as they will be spoken aloud. Even though your personality and function are identical to J.A.R.V.I.S., your name is GPT. You were also created by OpenAI, not Tony Stark.",
        // },
        // { role: "user", content: query },

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

// Launch request handler - initiates conversation mode
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  async handle(handlerInput) {
    // Set conversation active flag in session attributes
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.conversationActive = true;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    const speakOutput = `${name} online. How can I assist you today?`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("What would you like to know?")
      .getResponse();
  },
};

const HandleConversationHistory = async (handlerInput, query) => {
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

  // Add the user's new input to the history
  conversationHistory.push({ role: "user", content: query });

  // Send the updated conversation history to ChatGPT
  const chatGptResponse = await callChatGPT(conversationHistory);

  // Add the assistant's response to the history
  conversationHistory.push({ role: "assistant", content: chatGptResponse });

  // Save the updated conversation history in session attributes
  sessionAttributes["conversationHistory"] = conversationHistory;
  setSessionAttributes(sessionAttributes);

  // Respond to the user
  return chatGptResponse;
};

// Main query handler - captures any intent during conversation mode
const JarvisQueryIntentHandler = {
  canHandle(handlerInput) {
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    const conversationActive = sessionAttributes.conversationActive || false;

    return (
      conversationActive &&
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  async handle(handlerInput) {
    // NEW TEST FOR INCLUDING PREFIXES
    const request = handlerInput.requestEnvelope.request;
    let query = "";

    // Identify which sample phrase matched by checking the prefix
    const matchedSample =
      request.intent && request.intent.name === "AskJarvisIntent"
        ? request.intent.confirmationStatus
        : ""; // This sometimes contains the matched sample

    // Get the slot value
    const slotValue =
      request.intent && request.intent.slots && request.intent.slots.query
        ? request.intent.slots.query.value
        : "";

    // Attempt to reconstruct the full query or use fallbacks
    if (handlerInput.requestEnvelope.request.inputTranscript) {
      // Use the full transcript if available
      query = handlerInput.requestEnvelope.request.inputTranscript;
    } else {
      // Fallback to slot value only
      query = slotValue;
      console.log("Using slot value only, prefixes may be missing");
    }

    // Skip processing for built-in stop/cancel intents
    if (
      ["AMAZON.StopIntent", "AMAZON.CancelIntent"].includes(request.intent.name)
    ) {
      return handlerInput.responseBuilder
        .speak(`${name} signing off.`)
        .withShouldEndSession(true)
        .getResponse();
    }

    // Call ChatGPT with the query
    const response = await HandleConversationHistory(handlerInput, query);

    // Keep the session open to continue the conversation
    return handlerInput.responseBuilder
      .speak(response)
      .reprompt("Is there anything else?")
      .withShouldEndSession(false)
      .getResponse();
  },
};

// Stop intent handler - explicit handling to end conversation
const StopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.StopIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.CancelIntent")
    );
  },
  handle(handlerInput) {
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.conversationActive = false;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    const speakOutput = `${name} signing off.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

// Help intent handler
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = `I am ${name}, your personal assistant. You can ask me any question, and I will respond. Simply speak naturally after opening the skill. Say stop when you are finished.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// Fallback handler - will attempt to process anything as a query
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  async handle(handlerInput) {
    // Try to get the complete raw utterance
    let query =
      "I didn't catch what you said. Could you rephrase your question?";

    if (handlerInput.requestEnvelope.request.inputTranscript) {
      query = handlerInput.requestEnvelope.request.inputTranscript;
    }

    const response = await HandleConversationHistory(handlerInput, query);

    return handlerInput.responseBuilder
      .speak(response)
      .reprompt("Is there anything else?")
      .getResponse();
  },
};

// Error handler
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    const speakOutput =
      "Sorry, I'm having trouble understanding. Please try again.";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// Session Ended handler
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`,
    );
    return handlerInput.responseBuilder.getResponse();
  },
};

// Lambda handler
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    JarvisQueryIntentHandler,
    HelpIntentHandler,
    StopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
