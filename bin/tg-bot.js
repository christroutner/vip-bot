/*
  This is the parent library for the Telegram bot. This file is called by the
  bin/server.js file. This parent library then calls other support libraries.
*/

// Public npm libraries
const TelegramBot = require('node-telegram-bot-api')

// Local libraries
const TGUser = require('../src/models/tg-user')

let _this
const token = process.env.TELEGRAMTOKEN
const chatId = process.env.CHATID

class TGBot {
  constructor (config) {
    this.name = 'world'
    this.TGUser = TGUser

    // Created instance of TelegramBot
    this.bot = new TelegramBot(token, {
      polling: true
    })

    this.bot.on('message', this.processMsg)

    setInterval(function () {
      const now = new Date()

      _this.bot.sendMessage(chatId, `Heartbeat: ${now.toLocaleString()}`)
    }, 60000)

    _this = this
  }

  hello (name) {
    const displayName = name || this.name
    return `hello ${displayName}`
  }

  async processMsg (msg) {
    try {
      // console.log(msg)

      // Query the tgUser model from the data.
      const tgUser = await _this.TGUser.findOne({ tgId: msg.from.id }).exec()
      // console.log('result:', tgUser)

      // Create a new model if it doesn't already exist.
      if (!tgUser) {
        const newUserData = {
          username: msg.from.username,
          tgId: msg.from.id
        }

        // Create a new telegram user model in the DB.
        const newTgUser = new _this.TGUser(newUserData)
        await newTgUser.save()

        // Delete their message.
        await _this.bot.deleteMessage(chatId, msg.message_id)

        // TODO: Send greeting message.

        // Exit function.
        return
      }

      // Delete the users message if they haven't verified.
      if (!tgUser.hasVerified) {
        await _this.bot.deleteMessage(chatId, msg.message_id)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

module.exports = TGBot
