import * as Alexa from "ask-sdk-core";
// import { LaunchRequestHandler } from "./handlers/launch/launchHandler.js";
import { ErrorHandler } from "./handlers/error/errorHandler.js";
import { FallbackIntentHandler } from "./handlers/fallback/fallbackHandler.js";
import { HelpIntentHandler } from "./handlers/help/helpHandler.js";
import { AskJarvisIntentHandler } from "./handlers/jarvis/mainHandler.js";
import { StopIntentHandler } from "./handlers/stop/stopHandler.mjs";
import { LaunchRequestHandler } from "./handlers/launch/launchHandler.js";

// Lambda handler
export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    AskJarvisIntentHandler,
    HelpIntentHandler,
    StopIntentHandler,
    FallbackIntentHandler,
    // SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
