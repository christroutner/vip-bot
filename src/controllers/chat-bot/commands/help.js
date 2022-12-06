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
  This bot manages the the PSF VIP Telegram channel. Only users who possess a Governance NFT are allowed to speak in this room. The PSF functions as a meritocracy, and only those who have proven they have 'skin in the game' by owning a Governance NFT are allowed to speak in this VIP room.

  To verify an address, follow these steps:

  1) Create a BCH wallet at bchn-wallet.fullstack.cash. Go the Wallet view and write down your 12-word menmonic to back up your wallet. We recommend using a dedicated wallet for holding your governance NFT and for voting.

  2) Transfer the Governance NFT to the web wallet.

  3) Navigate to the 'Sign' page, and sign the word 'verify'. This will generate a cryptographic signature.

  3) Verify that you own the NFT with the following command:
     /verify <your address> <The signed message>

  Available commands:

    /help or /start
      - Bring up this help message.

    /verify <address> <signed message>
      - Verify that you own the cryptocurrency address by signing a message.



  (Video) Speaking in the VIP Telegram Channel:
  https://youtu.be/2ETAFV7_CTk

  (Video) How to Buy PSF Governance NFTs:
  https://youtu.be/IICUT404IHs
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
