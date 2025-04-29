import * as Alexa from "ask-sdk-core";
//TODO: Generic error handler for now. Add appropriate error cases and messaging
export const ErrorHandler = {
  canHandle(handlerInput, error) {
    return (
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.ErrorIntent"
    );
  },
  async handle(handlerInput, error) {
    console.error(`Error handled: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);

    console.error(`Request: ${JSON.stringify(handlerInput.requestEnvelope)}`);

    return handlerInput.responseBuilder
      .speak("There was an error processing your request.")
      .reprompt("Is there anything else?")
      .getResponse();
  },
};
