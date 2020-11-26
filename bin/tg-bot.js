/*
  This is the parent library for the Telegram bot. This file is called by the
  bin/server.js file. This parent library then calls other support libraries.
*/

// Local libraries
const Bot = require('../src/lib/bot')

// let _this

class TGBot {
  constructor (config) {
    // Instantiate the Telegram bot.
    this.bot = new Bot()

    // _this = this
  }

  start () {
    return 'VIP Telegram bot started.'
  }
}

module.exports = TGBot
