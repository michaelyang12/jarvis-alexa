import * as Alexa from "ask-sdk-core";

export const LaunchRequestHandler = {
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

    const speakOutput = `GPT online. How can I assist you today?`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("What would you like to know?")
      .getResponse();
  },
};
