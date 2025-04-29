import { HandleConversationHistory } from "../../core/gpt/gpt.js";
import * as Alexa from "ask-sdk-core";

// Main query handler - captures any intent during conversation mode
export const AskJarvisIntentHandler = {
  canHandle(handlerInput) {
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();

    // TODO: Verify conversation active. This might not be getting set correctly
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

    const slotValue =
      request.intent && request.intent.slots && request.intent.slots.query
        ? request.intent.slots.query.value
        : "";

    // Attempt to reconstruct the full query or use fallbacks
    if (handlerInput.requestEnvelope.request.inputTranscript) {
      query = handlerInput.requestEnvelope.request.inputTranscript;
    } else {
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

    const response = await HandleConversationHistory(handlerInput, query);

    return handlerInput.responseBuilder
      .speak(response)
      .reprompt("Is there anything else?")
      .withShouldEndSession(false)
      .getResponse();
  },
};
