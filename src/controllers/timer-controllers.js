/*
  This Controller library is concerned with timer-based functions that are
  kicked off periodicially.
*/

// Used to retain scope of 'this', when the scope is lost.
let _this

class TimerControllers {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Timer Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Timer Controller libraries.'
      )
    }

    this.debugLevel = localConfig.debugLevel

    // Library state
    this.state = {
      exampleTime: 60000 * 0.5
    }

    _this = this

    this.startTimers()
  }

  // Start all the time-based controllers.
  startTimers () {
    this.state.exampleInterval = setInterval(this.exampleTimerController, this.state.exampleTime)
  }

  // Poll the apps wallet address to see if new trades have come in.
  async exampleTimerController () {
    try {
      // Disable the timer interval while processing.
      // Note: This should be the second command.
      clearInterval(_this.state.exampleInterval)

      const now = new Date()
      console.log(`Example Timer Controller has fired at ${now.toLocaleString()}`)

      // Enable timer interval after processing.
      _this.state.exampleInterval = setInterval(_this.exampleTimerController, _this.state.exampleTime)

      return true
    } catch (err) {
      // Enable timer interval after processing.
      _this.state.exampleInterval = setInterval(_this.exampleTimerController, _this.state.exampleTime)

      // Do not throw an error. This is a top-level function.
      console.error('Error in timer-controllers.js/exampleTimerController(): ', err)

      return false
    }
  }
}

module.exports = TimerControllers
