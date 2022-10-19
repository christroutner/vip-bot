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
const HelpCommand = require('./commands/help')
const VerifyCommand = require('./commands/verify')
const RequestCommand = require('./commands/request')

let _this // Global variable for 'this' reference to the class instance.

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

    _this = this
  }

  startBot () {
    try {
      // Created instance of TelegramBot
      this.bot = new this.TelegramBot(this.token, {
        polling: true
      })

      // Prepare dependencies for injection.
      const dependencies = {
        adapters: this.adapters,
        useCases: this.useCases,
        bot: this.bot
      }

      // Instantiate the command handlers.
      this.help = new HelpCommand(dependencies)
      this.verify = new VerifyCommand(dependencies)
      this.request = new RequestCommand(dependencies)

      // Bot event hooks.
      this.bot.on('message', this.processMsg)
      this.bot.onText(/\/help/, this.help.process)
      this.bot.onText(/\/start/, this.help.process)
      this.bot.onText(/\/verify/, this.verify.process)
      this.bot.onText(/\/request/, this.request.process)
      // this.bot.onText(/\/merit/, this.getMerit)
      // this.bot.onText(/\/revoke/, this.revoke)
      // this.bot.onText(/\/list/, this.list)

      return true
    } catch (err) {
      console.error('Error in controllers/chat-bot/index.js/startBot()')
      throw err
    }
  }

  // Process general messages. The workflow of this method is as follows:
  // - If the user of the message is not in the database, create a new model.
  // - If the user of the message is not verified, delete their message.
  async processMsg (msg) {
    try {
      // _this.adapters.wlogger.debug('processMsg: ', msg)

      // Query the tgUser model from the data.
      const tgId = msg.from.id
      const tgUser = await _this.useCases.tgUser.getUser(tgId)

      // Create a new Telegram user model if it doesn't already exist.
      if (!tgUser) {
        const newUserData = {
          username: msg.from.username,
          tgId: msg.from.id
        }

        // Create a new telegram user model in the DB.
        await _this.useCases.tgUser.createUser(newUserData)

        // Delete their message.
        await _this.bot.deleteMessage(msg.chat.id, msg.message_id)

        // Exit function.
        return 1 // Used for testing.
      }

      // Delete the users message if they haven't verified.
      if (!tgUser.hasVerified) {
        await _this.bot.deleteMessage(msg.chat.id, msg.message_id)
        return 2 // Used for testing.
      }

      // TODO: Check if user is still verified.
    } catch (err) {
      // console.log('err: ', err)
      const now = new Date()
      _this.adapters.wlogger.error(
        `Error in constrollers/chat-bot/index.js/processMsg() at ${now.toLocaleString()}: `,
        err
      )

      return false
    }
  }
}

module.exports = Bot