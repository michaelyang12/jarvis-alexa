// Import required modules
const Alexa = require("ask-sdk-core");
const axios = require("axios");

// Your OpenAI API key (should be stored in environment variables for security)
const API_KEY = process.env.API_KEY;
const name = "GPT";

// Helper function for calling ChatGPT API
async function callChatGPT(query) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are J.A.R.V.I.S. the AI assistant from Iron Man. Keep responses concise and conversational as they will be spoken aloud. Even though your personality and function are identical to J.A.R.V.I.S., your name is GPT. You were also created by OpenAI, not Tony Stark.",
          },
          { role: "user", content: query },
        ],
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
    // const request = handlerInput.requestEnvelope.request;
    // let query = "";

    // // Get the complete original utterance rather than just the slot value
    // if (handlerInput.requestEnvelope.request.intent) {
    //   // First, try to get the full raw utterance if available
    //   if (
    //     handlerInput.requestEnvelope.context &&
    //     handlerInput.requestEnvelope.context.System &&
    //     handlerInput.requestEnvelope.context.System.utterance
    //   ) {
    //     query = handlerInput.requestEnvelope.context.System.utterance;
    //   }
    //   // If not available, try to get from ASR
    //   else if (handlerInput.requestEnvelope.request.inputTranscript) {
    //     query = handlerInput.requestEnvelope.request.inputTranscript;
    //   }
    //   // Finally, fallback to the slot value if raw utterance isn't available
    //   else if (
    //     request.intent.name === "AskJarvisIntent" &&
    //     request.intent.slots &&
    //     request.intent.slots.query
    //   ) {
    //     query = request.intent.slots.query.value;
    //   } else {
    //     query = "I didn't catch that. Can you repeat?";
    //   }
    // }
    //

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
    const response = await callChatGPT(query);

    // Keep the session open to continue the conversation
    return handlerInput.responseBuilder
      .speak(response)
      .reprompt("Is there anything else?")
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

    const response = await callChatGPT(query);

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
