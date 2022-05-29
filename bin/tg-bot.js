/*
  This is the parent library for the Telegram bot. This file is called by the
  bin/server.js file. This parent library then calls other support libraries.
*/

// Local libraries
const Bot = require('../src/adapters/bot')

// Instantiate the JWT handling library for FullStack.cash.
const JwtLib = require('jwt-bch-lib')
const jwtLib = new JwtLib({
  // Overwrite default values with the values in the config file.
  server: 'https://auth.fullstack.cash',
  login: process.env.FULLSTACKLOGIN,
  password: process.env.FULLSTACKPASS
})

let _this

class TGBot {
  constructor (config) {
    // Instantiate the Telegram bot.
    this.bot = new Bot()

    _this = this
  }

  async start () {
    // Get the JWT token needed to interact with the FullStack.cash API.
    await this.getJwt()
    await this.bot.bot.stopPolling()
    this.bot = new Bot()

    // Renew the JWT token every 24 hours
    setInterval(async function () {
      console.log('Updating FullStack.cash JWT token')
      await _this.getJwt()
      _this.bot.bot.stopPolling()
      _this.bot = new Bot()
    }, 60000 * 60 * 24)

    return 'VIP Telegram bot started.'
  }

  // Get's a JWT token from FullStack.cash.
  // This code based on the jwt-bch-demo:
  // https://github.com/Permissionless-Software-Foundation/jwt-bch-demo
  async getJwt () {
    try {
      // Log into the auth server.
      await jwtLib.register()

      let apiToken = jwtLib.userData.apiToken

      // Ensure the JWT token is valid to use.
      const isValid = await jwtLib.validateApiToken()

      // Get a new token with the same API level, if the existing token is not
      // valid (probably expired).
      if (!isValid.isValid) {
        apiToken = await jwtLib.getApiToken(jwtLib.userData.apiLevel)
        console.log('The JWT token was not valid. Retrieved new JWT token.\n')
      } else {
        console.log('JWT token is valid.\n')
      }

      // Set the environment variable.
      process.env.BCHJSTOKEN = apiToken
    } catch (err) {
      console.error('getJwt(): ', err)
      throw err
    }
  }
}

module.exports = TGBot
