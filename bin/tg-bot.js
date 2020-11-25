/*
  This is the parent library for the Telegram bot. This file is called by the
  bin/server.js file. This parent library then calls other support libraries.
*/

// Public npm libraries
const TelegramBot = require('node-telegram-bot-api')

let _this
const token = process.env.TELEGRAMTOKEN
const chatId = process.env.CHATID

class TGBot {
  constructor (config) {
    this.name = 'world'

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
      console.log(msg)

      await _this.bot.deleteMessage(chatId, msg.message_id)
    } catch (err) {
      console.error(err)
    }
  }
}

module.exports = TGBot
