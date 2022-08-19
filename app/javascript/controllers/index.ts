// Load all the controllers within this directory and all subdirectories. 
// Controller files must be named *_controller.js.

import { Application } from "stimulus"
import { definitionsFromContext } from "stimulus/webpack-helpers"
import * as Sentry from "@sentry/browser"

const application = Application.start()
if (process.env.NODE_ENV === "production") {
  const defaultErrorHandler = application.handleError
  application.handleError = (ex) => {
    Sentry.captureException(ex)
    defaultErrorHandler(ex, ex.message, ex)
  }
}
const context = require.context("controllers", true, /_controller\.[jt]sx?$/)
application.load(definitionsFromContext(context))
