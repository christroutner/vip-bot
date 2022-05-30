/*
  Controller library for the Telegram chat bot.
  Messages comming in on the Telegram channel are handled by this library.
*/

// Public npm libraries
const TelegramBot = require('node-telegram-bot-api')

// Local libraries
// const TGUser = require('./localdb/models/tg-user')
// const BCH = require('./bch')
// const wlogger = require('./wlogger')

// let _this // Global variable for 'this' reference to the class instance.

class Bot {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Telegram Bot Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Telegram Bot Controller libraries.'
      )
    }

    // Retrieve the bot token.
    if (localConfig.token) {
      this.token = localConfig.token
    } else if (process.env.BOTTELEGRAMTOKEN) {
      this.token = process.env.BOTTELEGRAMTOKEN
    }
    if (!this.token) {
      throw new Error(
        'Bot Telegram token must be passed as BOTTELEGRAMTOKEN environment variable.'
      )
    }

    // Retrieve the Chat ID of the Telegram room.
    if (localConfig.chatId) {
      this.chatId = localConfig.chatId
    } else if (process.env.CHATID) {
      this.chatId = process.env.CHATID
    }
    if (!this.chatId) {
      throw new Error(
        'Telegram chat room ID must be passed as CHATID environment variable.'
      )
    }

    // console.log(`this.token: ${this.token}, this.chatId: ${this.chatId}`)

    // Using constants here so they can be manipulated in tests.
    this.TWENTY_FOUR_HOURS = 60000 * 60 * 24
    this.PSF_THRESHOLD = 30000

    // Encapsulate external dependencies.
    // this.TGUser = TGUser
    // this.bch = new BCH()
    this.TelegramBot = TelegramBot
    this.bot = {}

    // Used for debugging.
    // setInterval(function () {
    //   const now = new Date()
    //
    //   _this.bot.sendMessage(chatId, `Heartbeat: ${now.toLocaleString()}`)
    // }, 60000)

    // _this = this
  }

  startBot () {
    try {
      // Created instance of TelegramBot
      this.bot = new this.TelegramBot(this.token, {
        polling: true
      })

      // Bot event hooks.
      this.bot.on('message', this.processMsg)
      // this.bot.onText(/\/verify/, this.verifyUser)
      // this.bot.onText(/\/help/, this.help)
      // this.bot.onText(/\/start/, this.help)
      // this.bot.onText(/\/merit/, this.getMerit)
      // this.bot.onText(/\/revoke/, this.revoke)
      // this.bot.onText(/\/list/, this.list)

      return true
    } catch (err) {
      console.error('Error in bot.js/startBot()')
      throw err
    }
  }

  // Process general messages. The workflow of this method is as follows:
  // - If the user of the message is not in the database, create a new model.
  // - If the user of the message is not verified, delete their message.
  async processMsg (msg) {
    try {
      this.adapters.wlogger.debug('processMsg: ', msg)
    } catch (err) {
      const now = new Date()
      this.adapters.wlogger.error(
        `Error in chat-bot.js/processMsg() at ${now.toLocaleString()}: `,
        err
      )
    }
  }
}

module.exports = Bot
