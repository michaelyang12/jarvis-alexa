import { HandleConversationHistory } from "../../core/gpt/gpt.js";
import * as Alexa from "ask-sdk-core";

// Fallback handler - will attempt to process anything as a query
export const FallbackIntentHandler = {
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
