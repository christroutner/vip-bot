/*
  This library contains methods for working with the Telegram bot.
*/

// Public npm libraries
const TelegramBot = require('node-telegram-bot-api')

// Local libraries
const TGUser = require('../models/tg-user')
const BCH = require('./bch')
const wlogger = require('./wlogger')

// Constants
const PSF_THRESHOLD = 10

let _this // Global variable for 'this' reference to the class instance.

class Bot {
  constructor (config) {
    // Retrieve the bot token.
    if (config && config.token) {
      this.token = config.token
    } else if (process.env.BOTTELEGRAMTOKEN) {
      this.token = process.env.BOTTELEGRAMTOKEN
    }
    if (!this.token) {
      throw new Error(
        'Bot Telegram token must be passed as BOTTELEGRAMTOKEN environment variable.'
      )
    }

    // Retrieve the Chat ID of the Telegram room.
    if (config && config.chatId) {
      this.chatId = config.chatId
    } else if (process.env.CHATID) {
      this.chatId = process.env.CHATID
    }
    if (!this.chatId) {
      throw new Error(
        'Telegram chat room ID must be passed as CHATID environment variable.'
      )
    }

    // Encapulate external dependencies.
    this.TGUser = TGUser
    this.bch = new BCH()

    // Created instance of TelegramBot
    this.bot = new TelegramBot(this.token, {
      polling: true
    })

    // Bot event hooks.
    this.bot.on('message', this.processMsg)
    this.bot.onText(/\/verify/, this.verifyUser)

    // Used for debugging.
    // setInterval(function () {
    //   const now = new Date()
    //
    //   _this.bot.sendMessage(chatId, `Heartbeat: ${now.toLocaleString()}`)
    // }, 60000)

    _this = this
  }

  // Process general messages. The workflow of this method is as follows:
  // - If the user of the message is not in the database, create a new model.
  // - If the user of the message is not verified, delete their message.
  async processMsg (msg) {
    try {
      wlogger.debug('processMsg: ', msg)

      // Query the tgUser model from the data.
      const tgUser = await _this.TGUser.findOne({ tgId: msg.from.id })
      // console.log('tgUser:', tgUser)

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
        await _this.bot.deleteMessage(_this.chatId, msg.message_id)

        // TODO: Send greeting message.

        // Exit function.
        return 1 // Used for testing.
      }

      // Delete the users message if they haven't verified.
      if (!tgUser.hasVerified) {
        await _this.bot.deleteMessage(_this.chatId, msg.message_id)
        return 2 // Used for testing.
      }

      return 3 // Used for testing.
    } catch (err) {
      const now = new Date()
      wlogger.error(`Error in bot.js/processMsg() at ${now.toLocaleString()}: `, err)
    }
  }

  // Handler for the /verify command. Syntax is:
  // /verify <bitcoincash:address> <signed message>
  // The signed message is expected to be the word 'verify' signed with a private
  // key using the slp-cli-wallet 'sign-message' command.
  // If the verification succeeds, the merit of the address is calculated and
  // if it meets the threashold, the user model will be marked as verified. This
  // will prevent their messages from being deleted.
  async verifyUser (msg) {
    try {
      wlogger.debug('verifyUser: ', msg)

      // Default return message.
      let returnMsg = `@${
        msg.from.username
      } your address could not be verified.`

      let retVal = 0 // Default return value.

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
        try {
          // Enclose in a try/catch as verifyMsg() will throw an error for
          // invalid formatted signatures.
          isValidSig = _this.bch.verifyMsg(verifyObj)
          // console.log(`Signature is valid: ${isValidSig}`)
        } catch (err) {
          await _this.bot.sendMessage(_this.chatId, returnMsg)

          return retVal
        }

        // If the signature is valid, update the user model.
        if (isValidSig) {
          const tgUser = await _this.TGUser.findOne({
            tgId: msg.from.id
          })
          // console.log(`tgUser: ${JSON.stringify(tgUser, null, 2)}`)

          tgUser.bchAddr = _this.bch.bchjs.SLP.Address.toCashAddress(
            msgParts[1]
          )
          tgUser.slpAddr = _this.bch.bchjs.SLP.Address.toSLPAddress(
            tgUser.bchAddr
          )
          tgUser.merit = await _this.bch.getMerit(tgUser.slpAddr)

          // Merit meets the threshold.
          if (tgUser.merit >= PSF_THRESHOLD) {
            // Mark the database model as having been verified.
            tgUser.hasVerified = true

            returnMsg = `@${
              msg.from.username
            } you have been successfully verified! You may now speak in the VIP room.`
            retVal = 2
          } else {
            // Merit does not meet the threshold.
            returnMsg = `@${
              msg.from.username
            } your signature was verified, but the address only has a merit value of ${
              tgUser.merit
            }, which does not meet the threashold of ${PSF_THRESHOLD}.`
            retVal = 3
          }

          await tgUser.save()
        }
      }

      await _this.bot.sendMessage(_this.chatId, returnMsg)

      return retVal
    } catch (err) {
      const now = new Date()
      wlogger.error(`Error in bot.js/verifyUser() at ${now.toLocaleString()}: `, err)
    }
  }
}

module.exports = Bot
