/*
  This library is in the process of being deprecated.

  This library contains methods for working with the Telegram bot.
*/

// Public npm libraries
const TelegramBot = require('node-telegram-bot-api')

// Local libraries
const TGUser = require('./localdb/models/tg-user')
const BCH = require('./bch')
const wlogger = require('./wlogger')

let _this // Global variable for 'this' reference to the class instance.

class Bot {
  constructor (localConfig = {}) {
    // Retrieve the bot token.
    if (localConfig.token) {
      this.token = localConfig.token
    } else if (process.env.BOTTELEGRAMTOKEN) {
      this.token = process.env.BOTTELEGRAMTOKEN
    }
    if (!this.token) {
      throw new Error(
        'Bot Telegram token must be passed as BOTTELEGRAMTOKEN environment variable.'
      )
    }

    // Retrieve the Chat ID of the Telegram room.
    if (localConfig.chatId) {
      this.chatId = localConfig.chatId
    } else if (process.env.CHATID) {
      this.chatId = process.env.CHATID
    }
    if (!this.chatId) {
      throw new Error(
        'Telegram chat room ID must be passed as CHATID environment variable.'
      )
    }

    // console.log(`this.token: ${this.token}, this.chatId: ${this.chatId}`)

    // Using constants here so they can be manipulated in tests.
    this.TWENTY_FOUR_HOURS = 60000 * 60 * 24
    this.PSF_THRESHOLD = 30000

    // Encapsulate external dependencies.
    this.TGUser = TGUser
    this.bch = new BCH()
    this.TelegramBot = TelegramBot
    this.bot = {}

    // Used for debugging.
    // setInterval(function () {
    //   const now = new Date()
    //
    //   _this.bot.sendMessage(chatId, `Heartbeat: ${now.toLocaleString()}`)
    // }, 60000)

    _this = this
  }

  startBot () {
    try {
      // Created instance of TelegramBot
      this.bot = new this.TelegramBot(this.token, {
        polling: true
      })

      // Bot event hooks.
      this.bot.on('message', this.processMsg)
      this.bot.onText(/\/verify/, this.verifyUser)
      this.bot.onText(/\/help/, this.help)
      this.bot.onText(/\/start/, this.help)
      this.bot.onText(/\/merit/, this.getMerit)
      this.bot.onText(/\/revoke/, this.revoke)
      this.bot.onText(/\/list/, this.list)

      return true
    } catch (err) {
      console.error('Error in bot.js/startBot()')
      throw err
    }
  }

  // Process general messages. The workflow of this method is as follows:
  // - If the user of the message is not in the database, create a new model.
  // - If the user of the message is not verified, delete their message.
  async processMsg (msg) {
    try {
      wlogger.debug('processMsg: ', msg)
      // console.log('processMsg: ', msg)

      // Query the tgUser model from the data.
      const tgUser = await this.TGUser.findOne({ tgId: msg.from.id })
      // console.log('tgUser:', tgUser)

      // Create a new model if it doesn't already exist.
      if (!tgUser) {
        const newUserData = {
          username: msg.from.username,
          tgId: msg.from.id
        }

        // Create a new telegram user model in the DB.
        const newTgUser = new this.TGUser(newUserData)
        await newTgUser.save()

        // Delete their message.
        await this.bot.deleteMessage(this.chatId, msg.message_id)

        // TODO: Send greeting message.

        // Exit function.
        return 1 // Used for testing.
      }

      // Delete the users message if they haven't verified.
      if (!tgUser.hasVerified) {
        await this.bot.deleteMessage(this.chatId, msg.message_id)
        return 2 // Used for testing.
      }

      // If more than 24 hours has passed since the user's merit was verified,
      // reverify it.
      const now = new Date()
      const nowNum = now.getTime()
      const lastVerifiedDate = new Date(tgUser.lastVerified)
      const timeDiff = nowNum - lastVerifiedDate.getTime()
      if (timeDiff > this.TWENTY_FOUR_HOURS) {
        wlogger.debug('More than 24 hours since user was verified.')

        // Update the merit.
        tgUser.merit = await this.bch.getMerit(tgUser.slpAddr)
        wlogger.debug(
          `merit: ${tgUser.merit}, threshold: ${this.PSF_THRESHOLD}`
        )

        // Merit meets the threshold.
        if (tgUser.merit >= this.PSF_THRESHOLD) {
          wlogger.debug('User had their merit reverified.')

          // Mark the database model as having been verified.
          tgUser.hasVerified = true
          tgUser.lastVerified = now.toISOString()
        } else {
          wlogger.debug('Users merit has falled below threshold.')

          // Mark the database model as being unverified.
          tgUser.hasVerified = false

          const returnMsg = `@${
            msg.from.username
          } you no longer have enough merit to speak in the room. Your merit is only ${
            tgUser.merit
          }. Use the /verify command once your address has accrued enough merit.`

          const botMsg = await this.bot.sendMessage(this.chatId, returnMsg)

          // Delete bot spam after some time.
          this.deleteBotSpam(msg, botMsg)
        }

        // Save the user to the database.
        await tgUser.save()

        return 4
      }

      return 3 // Used for testing.
    } catch (err) {
      const now = new Date()
      wlogger.error(
        `Error in bot.js/processMsg() at ${now.toLocaleString()}: `,
        err
      )
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
          const botMsg = await _this.bot.sendMessage(_this.chatId, returnMsg)

          // Delete bot spam after some time.
          _this.deleteBotSpam(msg, botMsg)

          return retVal
        }

        // If the signature is valid, update the user model.
        if (isValidSig) {
          const tgUser = await _this.TGUser.findOne({
            tgId: msg.from.id
          })
          // console.log(`tgUser: ${JSON.stringify(tgUser, null, 2)}`)

          const bchAddr = _this.bch.bchjs.SLP.Address.toCashAddress(msgParts[1])

          // Return an error and exit if another user has already claimed that
          // address.
          const addressIsClaimed = await _this.checkDupClaim(bchAddr, msg)
          if (addressIsClaimed) {
            returnMsg = `@${addressIsClaimed} has already claimed that address. They must first revoke it with the /revoke command.`

            const botMsg = await _this.bot.sendMessage(_this.chatId, returnMsg)

            // Delete bot spam after some time.
            _this.deleteBotSpam(msg, botMsg)

            return 5 // Return specific value for testing.
          }

          // Calculate values to store in the tg-user model for this user.
          tgUser.bchAddr = bchAddr
          tgUser.slpAddr = _this.bch.bchjs.SLP.Address.toSLPAddress(
            tgUser.bchAddr
          )
          tgUser.merit = await _this.bch.getMerit(tgUser.slpAddr)
          const now = new Date()
          tgUser.lastVerified = now.toISOString()

          // Merit meets the threshold.
          if (tgUser.merit >= _this.PSF_THRESHOLD) {
            // Mark the database model as having been verified.
            tgUser.hasVerified = true

            returnMsg = `@${
              msg.from.username
            } you have been successfully verified! You may now speak in the VIP room.`
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

          await tgUser.save()
        }
      }

      const botMsg = await _this.bot.sendMessage(_this.chatId, returnMsg)

      // Delete bot spam after some time.
      _this.deleteBotSpam(msg, botMsg)

      return retVal
    } catch (err) {
      const now = new Date()
      wlogger.error(
        `Error in bot.js/verifyUser() at ${now.toLocaleString()}: `,
        err
      )
    }
  }

  // Check to see if the address is already claimed.
  // It returns false if no user has claimed the bchAddr. Otherwise it returns
  // the Telegram username of the person who 'owns' the address.
  async checkDupClaim (bchAddr, msg) {
    try {
      const tgUser = await _this.TGUser.findOne({ bchAddr })

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
      wlogger.error(
        `Error in bot.js/checkDupClaim() at ${now.toLocaleString()}: `,
        err
      )
      return 'errorInCheckDupClaim'
    }
  }

  // Display help message to the user.
  async help (msg) {
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
    _this.deleteBotSpam(msg, botMsg)
  }

  // Query the merit on another user (or yourself)
  async getMerit (msg) {
    try {
      // console.log(`getMerit message: ${JSON.stringify(msg, null, 2)}`)

      let retVal = 0 // default return value

      // Convert the message into an array of parts.
      const msgParts = msg.text.toString().split(' ')

      const username = msgParts[1].substring(1)
      // console.log(`username: ${username}`)

      const tgUser = await _this.TGUser.findOne({ username })

      let botMsg
      if (!tgUser) {
        botMsg = await _this.bot.sendMessage(msg.chat.id, 'User not found.')
      } else {
        retVal = 1
        const merit = tgUser.merit
        botMsg = await _this.bot.sendMessage(
          msg.chat.id,
          `User ${username} has a merit score of ${merit}`
        )
      }

      // Delete bot spam after some time.
      _this.deleteBotSpam(msg, botMsg)

      return retVal
    } catch (err) {
      // console.error(err)
      wlogger.error('Error in bot.js/getMerit(): ', err)
    }
  }

  // This function will delete the bot messages after a short time window. This
  // prevents bot spam in the channel.
  deleteBotSpam (msg, botMsg) {
    // If this command is issued in the group, delete it after the user has had
    // a chance to read it. This will prevent bot spam.
    if (msg.chat.type === 'supergroup') {
      const timerHandle = setTimeout(async function () {
        await _this._deleteMsgs(msg, botMsg)
      }, 30000) // 30 seconds.

      return timerHandle
    }
  }

  async _deleteMsgs (msg, botMsg) {
    await _this._deleteMsgQuietly(msg.chat.id, msg.message_id)
    await _this._deleteMsgQuietly(botMsg.chat.id, botMsg.message_id)
  }

  async _deleteMsgQuietly (chatId, msgId) {
    try {
      await _this.bot.deleteMessage(chatId, msgId)
    } catch (err) {
      /* Exit quietly */
    }
  }

  // Allows a user to revoke ownership of a BCH address. It allows other users
  // to claim it.
  async revoke (msg) {
    try {
      let retVal = 0 // Default return value.
      let retMsg = ''

      // Convert the message into an array of parts.
      const msgParts = msg.text.toString().split(' ')
      // console.log(`msgParts: ${JSON.stringify(msgParts, null, 2)}`)

      // If the message does not have 2 parts, ignore it.
      if (msgParts.length === 2) {
        retVal = 1 // Signal that the message was formatted correctly.

        const bchAddr = msgParts[1]

        const tgUser = await _this.TGUser.findOne({ bchAddr })

        // If no user is found, return false.
        if (!tgUser) {
          retMsg = `A user with address ${bchAddr} could not be found in the database`
          retVal = 2
        } else {
          // User was found in the database.

          const msgSender = msg.from.username

          // If the user is the same one who 'owns' the address, then return false.
          if (msgSender !== tgUser.username) {
            retMsg = `@${
              msg.from.username
            } you do not own address ${bchAddr}, so you can not revoke ownership of it.`
            retVal = 3
          } else {
            // User is currently assigned the address.

            // Update the tg-user model for this user.
            tgUser.bchAddr = ''
            tgUser.slpAddr = ''
            tgUser.hasVerified = false
            tgUser.merit = 0
            await tgUser.save()

            retMsg = `@${
              msg.from.username
            } you have successfully revoked ownership of address ${bchAddr}`
            retVal = 4
          }
        }
      }

      const botMsg = await _this.bot.sendMessage(retMsg)

      // Delete bot spam after some time.
      _this.deleteBotSpam(msg, botMsg)

      return retVal
    } catch (err) {
      // console.error(err)
      wlogger.error('Error in bot.js/revoke(): ', err)
      return 6
    }
  }

  // List all the people that have the ability to speak in the VIP room.
  async list (msg) {
    try {
      const users = await _this.TGUser.find({ hasVerified: true })
      // console.log(`users: ${JSON.stringify(users, null, 2)}`)

      let outStr = 'Verified users in this channel:\n'
      for (let i = 0; i < users.length; i++) {
        const thisUser = users[i]

        outStr += `@${thisUser.username}\n`
      }
      outStr += '\n'

      // console.log(`${outStr}`)

      const botMsg = await _this.bot.sendMessage(msg.chat.id, outStr)

      // Delete bot spam after some time.
      _this.deleteBotSpam(msg, botMsg)
    } catch (err) {
      wlogger.error('Error in bot.js/list(): ', err)
    }
  }
}

module.exports = Bot
