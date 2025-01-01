/*
  This is a top-level library that encapsulates all the additional Controllers.
  The concept of Controllers comes from Clean Architecture:
  https://troutsblog.com/blog/clean-architecture
*/

// Public npm libraries.

// Load the Clean Architecture Adapters library
const Adapters = require('../adapters')

// Load the Clean Architecture Use Case libraries.
const UseCases = require('../use-cases')

// Load the REST API Controllers.
const RESTControllers = require('./rest-api')

// Timer-based controllers.
const TimerControllers = require('./timer-controllers')

const ChatBot = require('./chat-bot')

class Controllers {
  constructor (localConfig = {}) {
    // Encapsulate Dependencies
    this.adapters = new Adapters()
    this.useCases = new UseCases({ adapters: this.adapters })
    this.timerControllers = new TimerControllers({ adapters: this.adapters, useCases: this.useCases })
    this.bot = new ChatBot({ adapters: this.adapters, useCases: this.useCases })
  }

  // Spin up any adapter libraries that have async startup needs.
  async initAdapters () {
    await this.adapters.startAdapters()
  }

  // Run any Use Cases to startup the app.
  async initUseCases () {
    await this.useCases.startUseCases()
  }

  // Top-level function for this library.
  // Start the various Controllers and attach them to the app.
  attachRESTControllers (app) {
    const restControllers = new RESTControllers({
      adapters: this.adapters,
      useCases: this.useCases
    })

    // Attach the REST API Controllers associated with the boilerplate code to the Koa app.
    restControllers.attachRESTControllers(app)
  }

  // Add the JSON RPC router to the ipfs-coord adapter.
  // attachRPCControllers () {
  //  const jsonRpcController = new JSONRPC({
  //    adapters: this.adapters,
  //    useCases: this.useCases
  //  })
  //
  //  // Attach the input of the JSON RPC router to the output of ipfs-coord.
  //  this.adapters.ipfs.ipfsCoordAdapter.attachRPCRouter(
  //    jsonRpcController.router
  //  )
  // }
}

module.exports = Controllers
