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
  This bot manages the the PSF public Telegram channel. Only users who have verified they own a PSF Telegram token are allowed to speak in this room. This protects the channel against bots.

  To obtain a PSF Telegram token, follow these steps:

  1) Create a wallet at wallet.fullstack.cash. Go the Wallet view and write down your 12-word menmonic to back up your wallet.

  2) Get the 'bitcoincash:' address for your wallet from the Wallet view or BCH view.

  3) Request a PSF Telegram token using the /request command with this bot. Give it the BCH address for your wallet, and it will send you a token.
    /request <your BCH address>

  4) Get the WIF private key from the Wallet view of wallet.fullstack.cash. A WIF private key starts with the letter 'K' or 'L'.

  3) Sign a message to verify that you own the address holding the PSF Telegram token. This can be done at https://sign.psfoundation.info. Sign the word 'verify'.

  4) Use the /verify command to verify your wallet address, like this:
    /verify <your BCH address> <The signed message>

  Available commands:

    /help or /start
      - Bring up this help message.

    /request <BCH address>
      - Request a PSF Telegram token.

    /verify <BCH address> <signed message>
      - Verify that you own the Bitcoin Cash address by signing a message.
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
