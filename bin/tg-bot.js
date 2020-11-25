/*
  This is the parent library for the Telegram bot. This file is called by the
  bin/server.js file. This parent library then calls other support libraries.
*/

class TGBot {
  constructor (config) {
    this.name = 'world'
  }

  hello (name) {
    const displayName = name || this.name
    return `hello ${displayName}`
  }
}

module.exports = TGBot
