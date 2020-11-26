/*
  This library contains methods for working with the Telegram bot.
*/

// Public npm libraries
const TelegramBot = require('node-telegram-bot-api')

// Local libraries
const TGUser = require('../models/tg-user')
const BCH = require('./bch')

// Constants
const PSF_THRESHOLD = 100

let _this // Global variable for 'this' reference to the class instance.
const token = process.env.TELEGRAMTOKEN
const chatId = process.env.CHATID

class Bot {
  constructor (config) {
    if (!token) {
      throw new Error(
        'Bot Telegram token must be passed as TELEGRAMTOKEN environment variable.'
      )
    }
    if (!chatId) {
      throw new Error(
        'Telegram chat room ID must be passed as CHATID environment variable.'
      )
    }

    // Encapulate external dependencies.
    this.TGUser = TGUser
    this.bch = new BCH()

    // Created instance of TelegramBot
    this.bot = new TelegramBot(token, {
      polling: true
    })

    // Bot event hooks.
    this.bot.on('message', this.processMsg)
    this.bot.onText(/\/verify/, this.verifyUser)

    // Used for debugging.
    setInterval(function () {
      const now = new Date()

      _this.bot.sendMessage(chatId, `Heartbeat: ${now.toLocaleString()}`)
    }, 60000)

    _this = this
  }

  // Process general messages. The workflow of this method is as follows:
  // - If the user of the message is not in the database, create a new model.
  // - If the user of the message is not verified, delete their message.
  async processMsg (msg) {
    try {
      console.log('processMsg: ', msg)

      // Query the tgUser model from the data.
      const tgUser = await _this.TGUser.findOne({ tgId: msg.from.id }).exec()
      // console.log('result:', tgUser)

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
        await _this.bot.deleteMessage(chatId, msg.message_id)

        // TODO: Send greeting message.

        // Exit function.
        return
      }

      // Delete the users message if they haven't verified.
      if (!tgUser.hasVerified) {
        await _this.bot.deleteMessage(chatId, msg.message_id)
      }
    } catch (err) {
      console.error(err)
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
      console.log('verifyUser: ', msg)

      // const now = new Date()

      // _this.bot.sendMessage(
      //   chatId,
      //   `You used the /verify command at ${now.toLocaleString()}`
      // )

      const msgParts = msg.text.toString().split(' ')
      // console.log(`msgParts: ${JSON.stringify(msgParts, null, 2)}`)

      let returnMsg = `@${
        msg.from.username
      } your address could not be verified.`

      if (msgParts.length === 3) {
        const verifyObj = {
          bchAddr: msgParts[1],
          signedMsg: msgParts[2]
        }

        const isValidSig = _this.bch.verifyMsg(verifyObj)
        console.log(`Signature is valid: ${isValidSig}`)

        // If the signature is valid, update the user model.
        if (isValidSig) {
          const tgUser = await _this.TGUser.findOne({
            tgId: msg.from.id
          }).exec()

          if (!tgUser) {
            throw new Error('Verified user could not be found in database.')
          }

          tgUser.bchAddr = msgParts[1]
          tgUser.slpAddr = _this.bch.bchjs.SLP.Address.toSLPAddress(
            tgUser.bchAddr
          )
          tgUser.merit = await _this.bch.getMerit(tgUser.slpAddr)

          // Merit meets the threshold.
          if (tgUser.merit >= PSF_THRESHOLD) {
            tgUser.hasVerified = true
            returnMsg = `@${
              msg.from.username
            } you have been successfully verified! You may now speak in the VIP room.`
          } else {
            // Merit does not meet the threshold.
            returnMsg = `@${
              msg.from.username
            } your signature was verified, but the address only has a merit value of ${
              tgUser.merit
            }, which does not meet the threashold of ${PSF_THRESHOLD}.`
          }

          await tgUser.save()
        }

        _this.bot.sendMessage(chatId, returnMsg)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

module.exports = Bot
