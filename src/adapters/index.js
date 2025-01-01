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
      console.log('Async Adapters have been started.')
    } catch (err) {
      console.error('Error in adapters/index.js/startAdapters()')
      throw err
    }
  }
}

module.exports = Adapters
