/*
  Verify command handler

  This command is used to verify that an address is controlled by a user and that
  it has enough merit to be allowed to speak in the VIP channel.
*/

// Local libraries
const BotCommandUtil = require('./util')

let _this

class VerifyCommand {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.bot = localConfig.bot
    if (!this.bot) {
      throw new Error('chat bot instance required when instantiating VerifyCommand Class')
    }
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating VerifyCommand Class.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating VerifyCommand Class.'
      )
    }

    // Encapsulate dependencies
    this.util = new BotCommandUtil(localConfig)

    // Constants
    this.TWENTY_FOUR_HOURS = 60000 * 60 * 24
    this.PSF_THRESHOLD = this.adapters.config.meritThreshold

    _this = this
  }

  // Handler for the /verify command. Syntax is:
  // /verify <bitcoincash:address> <signed message>
  // The signed message is expected to be the word 'verify' signed with a private
  // key using the slp-cli-wallet 'sign-message' command.
  // If the verification succeeds, the merit of the address is calculated and
  // if it meets the threashold, the user model will be marked as verified. This
  // will prevent their messages from being deleted.
  async process (msg) {
    let retVal = 0 // Default return value.

    try {
      // _this.adapters.wlogger.debug('verifyUser: ', msg)

      // Default return message.
      let returnMsg = `@${
        msg.from.username
      } your address could not be verified.`

      // Convert the message into an array of parts.
      const msgParts = msg.text.toString().split(' ')
      // console.log(`msgParts: ${JSON.stringify(msgParts, null, 2)}`)

      // If the message does not have 3 parts, ignore it.
      if (msgParts.length === 3) {
        retVal = 1 // Signal that the message was formatted correctly.

        // Verify the signature.
        const verifyObj = {
          bchAddr: msgParts[1],
          signedMsg: msgParts[2]
        }

        let isValidSig = false

        // Enclose in a try/catch as verifyMsg() will throw an error for
        // invalid formatted signatures.
        isValidSig = _this.adapters.bch.verifyMsg(verifyObj)
        console.log(`Signature is valid: ${isValidSig}`)

        // If the signature is valid, update the user model.
        if (isValidSig) {
          // const tgUser = await _this.TGUser.findOne({
          //   tgId: msg.from.id
          // })
          const tgUser = await _this.useCases.tgUser.getUser(msg.from.id)
          console.log(`tgUser: ${JSON.stringify(tgUser, null, 2)}`)

          // const bchAddr = _this.adapters.bch.bchjs.SLP.Address.toCashAddress(msgParts[1])
          let bchAddr = msgParts[1]
          if (bchAddr.includes('ecash')) {
            bchAddr = _this.adapters.bch.bchjs.Address.ecashtoCashAddress(bchAddr)
          }

          // Return an error and exit if another user has already claimed that
          // address.
          const addressIsClaimed = await _this.checkDupClaim(bchAddr, msg)
          if (addressIsClaimed) {
            returnMsg = `@${addressIsClaimed} has already claimed that address.`

            const botMsg = await _this.bot.sendMessage(_this.chatId, returnMsg)

            // Delete bot spam after some time.
            _this.util.deleteBotSpam(msg, botMsg)

            return 5 // Return specific value for testing.
          }

          // Calculate values to store in the tg-user model for this user.
          tgUser.bchAddr = bchAddr
          tgUser.slpAddr = _this.adapters.bch.bchjs.SLP.Address.toSLPAddress(
            tgUser.bchAddr
          )
          // tgUser.merit = await _this.adapters.bch.getMerit(tgUser.slpAddr)
          // tgUser.merit = await _this.adapters.bch.hasToken(tgUser.bchAddr)
          tgUser.merit = 40000
          // console.log('tgUser.merit: ', tgUser.merit)

          const now = new Date()
          tgUser.lastVerified = now.toISOString()

          // Merit meets the threshold.
          if (tgUser.merit >= _this.PSF_THRESHOLD) {
            // Mark the database model as having been verified.
            tgUser.hasVerified = true

            returnMsg = `@${
              msg.from.username
            } you have been successfully verified! You may now speak in the PSF Telegram room.`
            retVal = 2
          } else {
            // Merit does not meet the threshold.

            // Mark the database model as being unverified.
            tgUser.hasVerified = false

            returnMsg = `@${
              msg.from.username
            } your signature was verified, but the address only has a merit value of ${
              tgUser.merit
            }, which does not meet the threashold of ${_this.PSF_THRESHOLD}.`
            retVal = 3
          }

          // await tgUser.save()
          await _this.useCases.tgUser.updateUser(tgUser, tgUser)
        }

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
        `Error in commands/verify.js/process() at ${now.toLocaleString()}: `,
        err
      )

      return 0
    }
  }

  // Check to see if the address is already claimed.
  // It returns false if no user has claimed the bchAddr. Otherwise it returns
  // the Telegram username of the person who 'owns' the address.
  async checkDupClaim (bchAddr, msg) {
    try {
      // const tgUser = await _this.TGUser.findOne({ bchAddr })
      const tgUser = await _this.useCases.tgUser.getUser(msg.from.id)

      // If no user is found, return false.
      if (!tgUser) return false

      const msgSender = msg.from.username

      // If the user is the same one who 'owns' the address, then return false.
      if (msgSender === tgUser.username) return false

      // Otherwise return the Telegram username of the person who 'owns' the
      // address.
      return tgUser.username
    } catch (err) {
      const now = new Date()
      _this.adapters.wlogger.error(
        `Error in bot.js/checkDupClaim() at ${now.toLocaleString()}: `,
        err
      )
      return 'errorInCheckDupClaim'
    }
  }
}

module.exports = VerifyCommand
