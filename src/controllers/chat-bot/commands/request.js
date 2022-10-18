/*
  Used to request a token.
*/

// Local libraries
const BotCommandUtil = require('./util')

let _this

class RequestCommand {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.bot = localConfig.bot
    if (!this.bot) {
      throw new Error('chat bot instance required when instantiating RequestCommand Class')
    }
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating RequestCommand Class.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating RequestCommand Class.'
      )
    }

    // Encapsulate dependencies
    this.util = new BotCommandUtil(localConfig)

    // Constants
    this.TWENTY_FOUR_HOURS = 60000 * 60 * 24
    this.PSF_THRESHOLD = this.adapters.config.meritThreshold

    _this = this
  }

  // Handler for the /request command. Syntax is:
  // /request <bitcoincash:address>
  // The bot will send an SLP token to the address. This will allow the user to
  // speak in the chat room.
  async process (msg) {
    let retVal = 0 // Default return value.

    try {
      // _this.adapters.wlogger.debug('verifyUser: ', msg)

      // Default return message.
      let returnMsg = `@${
        msg.from.username
      }, I could not send you a token.`

      // Convert the message into an array of parts.
      const msgParts = msg.text.toString().split(' ')
      // console.log(`msgParts: ${JSON.stringify(msgParts, null, 2)}`)

      // If the message does not have 2 parts, ignore it.
      if (msgParts.length === 2) {
        retVal = 1 // Signal that the message was formatted correctly.

        const userAddr = msgParts[1]

        const txid = await _this.adapters.bch.sendToken(userAddr)

        returnMsg = `PSF Telegram token sent! See it on the block explorer: https://token.fullstack.cash/transactions/?txid=${txid}`

        const botMsg = await _this.bot.sendMessage(msg.chat.id, returnMsg)

        // Delete bot spam after some time.
        _this.util.deleteBotSpam(msg, botMsg)
      }

      return retVal
    } catch (err) {
      // console.error('Error in verify/process()')
      // throw err

      const now = new Date()
      _this.adapters.wlogger.error(
        `Error in commands/request.js/process() at ${now.toLocaleString()}: `,
        err
      )

      return 0
    }
  }
}

module.exports = RequestCommand
