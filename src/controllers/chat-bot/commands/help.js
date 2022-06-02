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
      const outMsg = `
  The bot manages the VIP room for the PSF. Only users who have verified they own PSF tokens with the required Merit are allowed to speak in the VIP room.

  To verify your merit, follow these steps:

  1) Go to https://message.fullstack.cash and create a wallet.

  2) Use the 'Sign Message' area of the app to sign a the word 'verify'

  3) Use the /verify command to verify your wallet address, like this:
    /verify <your BCH address> <The signed message>

  4) Purchase PSF tokens at https://PSFoundation.cash or earn them by completing programming tasks (bounties can be found here: https://github.com/Permissionless-Software-Foundation/bounties). Send these tokens to your wallet address.

  Your 'Merit' is calculated this way:
  Merit = token quantity X token age (in days)

  If you obtain fewer tokens, it will take more time to aquire the required merit. If you obtain more, it takes less time.

  A video walkthrough of how to join the VIP room, as well as how to use other PSF communication channels can be found here:
  https://youtu.be/KOlM4dU6Gj0

  If you need help, ask for guidence on @permissionless_software

  Available commands:

    /help or /start
      - Bring up this help message.

    /verify <BCH address> <signed message>
      - Verify that you own the Bitcoin Cash address by signing a message. The bot will track the merit associated with this address.

    /revoke <BCH address>
      - Revoke ownership of a BCH address.

    /merit @username
      - Query the merit for a user in this channel.

    /list
      - List all the people in the channel that have enough merit to speak.
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
