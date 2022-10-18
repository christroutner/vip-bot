/*
  Help command handler
*/

const BotCommandUtil = require('./util')

let _this

class HelpCommand {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.bot = localConfig.bot
    if (!this.bot) throw new Error('chat bot instance required when instantiating HelpCommand Class')

    // Encapsulate dependencies
    this.util = new BotCommandUtil(localConfig)

    _this = this
  }

  async process (msg) {
    try {
      // Convert the message into an array of parts.
      const msgParts = msg.text.toString().split(' ')
      // console.log(`msgParts: ${JSON.stringify(msgParts, null, 2)}`)

      // Ignore if there are any additional words in the command.
      if (msgParts.length !== 1) return

      const outMsg = `
  The bot manages the VIP room for the PSF. Only users who have verified they own PSF tokens with the required Merit are allowed to speak in the VIP room.

  To verify your merit, follow these steps:

  1) Purchase PSF tokens at https://PSFoundation.cash or earn them by completing programming tasks (ask about bounties here: @permissionless_software). You can use wallet.fullstack.cash to manage your PSF tokens.

  2) Get the WIF private key storing your PSF tokens. We recommend holding your PSF tokens on a paper wallet, which can be generated at https://paperwallet.psfoundation.info. A WIF private key starts with the letter 'K' or 'L'.

  3) Sign a message to verify that you own the address holding those PSF tokens. This can be done at https://sign.psfoundation.info. Sign the word 'verify'.

  4) Use the /verify command to verify your wallet address, like this:
    /verify <your BCH address> <The signed message>

  Your 'Merit' is calculated this way:
  Merit = token quantity X token age (in days)

  If you obtain fewer tokens, it will take more time to aquire the required merit. If you obtain more, it takes less time.

  If you need help, ask for guidence on @permissionless_software

  Available commands:

    /help or /start
      - Bring up this help message.

    /request <BCH address>
      - Request a PSF Telegram token.

    /verify <BCH address> <signed message>
      - Verify that you own the Bitcoin Cash address by signing a message. The bot will track the merit associated with this address.
  `

      const botMsg = await _this.bot.sendMessage(msg.chat.id, outMsg)
      // console.log(`botMsg: ${JSON.stringify(botMsg, null, 2)}`)

      // Delete bot spam after some time.
      _this.util.deleteBotSpam(msg, botMsg)
    } catch (err) {
      console.error('Error in help/process()')
      throw err
    }
  }
}

module.exports = HelpCommand
