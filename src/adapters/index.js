/*
  This is a top-level library that encapsulates all the additional Adapters.
  The concept of Adapters comes from Clean Architecture:
  https://troutsblog.com/blog/clean-architecture
*/

// Load individual adapter libraries.
const LocalDB = require('./localdb')
const LogsAPI = require('./logapi')
const Passport = require('./passport')
const Nodemailer = require('./nodemailer')
const wlogger = require('./wlogger')
const JSONFiles = require('./json-files')
const config = require('../../config')
const Bch = require('./bch')
const JwtLib = require('jwt-bch-lib')

class Adapters {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.localdb = new LocalDB()
    this.logapi = new LogsAPI()
    this.passport = new Passport()
    this.nodemailer = new Nodemailer()
    this.jsonFiles = new JSONFiles()
    this.config = config
    this.wlogger = wlogger
    this.bch = new Bch()
  }

  // Startup any asynchronous processes needed to initialize the adapter libraries.
  async startAdapters () {
    try {
      this.jwtLib = new JwtLib({
        // Overwrite default values with the values in the config file.
        server: 'https://auth.fullstack.cash',
        login: process.env.FULLSTACKLOGIN,
        password: process.env.FULLSTACKPASS
      })
      const apiToken = await this.getJwt()

      // Update the wallet so that it uses the new JWT token.
      await this.bch.updateWallet({ apiToken })

      console.log('Async Adapters have been started.')
    } catch (err) {
      console.error('Error in adapters/index.js/startAdapters()')
      throw err
    }
  }

  // Get's a JWT token from FullStack.cash.
  // This code based on the jwt-bch-demo:
  // https://github.com/Permissionless-Software-Foundation/jwt-bch-demo
  async getJwt () {
    try {
      // TODO: Move this JWT token handling to its own library. Also add a timer-interval to
      // renew the JWT token every 24 hours.

      // Log into the auth server.
      await this.jwtLib.register()

      let apiToken = this.jwtLib.userData.apiToken
      console.log('jwtLib.userData: ', this.jwtLib.userData)

      // Ensure the JWT token is valid to use.
      const isValid = await this.jwtLib.validateApiToken()

      // Get a new token with the same API level, if the existing token is not
      // valid (probably expired).
      if (!isValid.isValid) {
        apiToken = await this.jwtLib.getApiToken(this.jwtLib.userData.apiLevel)
        console.log('The JWT token was not valid. Retrieved new JWT token.\n')
      } else {
        console.log('JWT token is valid.\n')
      }

      // Set the environment variable.
      process.env.BCHJSTOKEN = apiToken
      console.log('Updating BCHJSTOKEN: ', apiToken)

      return apiToken
    } catch (err) {
      console.error('getJwt(): ', err)
      throw err
    }
  }
}

module.exports = Adapters
