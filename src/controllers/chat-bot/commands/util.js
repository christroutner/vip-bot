/*
  Common utility methods used by all commands
*/

let _this

class BotCommandUtil {
  constructor (localConfig = {}) {
    this.bot = localConfig.bot
    if (!this.bot) throw new Error('chat bot instance required when instantiating BotCommandUtil Class')

    // Constants
    this.delayMs = 30000 // 30 seconds.

    _this = this
  }

  // This function will delete the bot messages after a short time window. This
  // prevents bot spam in the channel.
  deleteBotSpam (msg, botMsg) {
    // If this command is issued in the group, delete it after the user has had
    // a chance to read it. This will prevent bot spam.
    if (msg.chat.type === 'supergroup') {
      const timerHandle = setTimeout(async function () {
        await _this._deleteMsgs(msg, botMsg)
      }, this.delayMs)

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
}

module.exports = BotCommandUtil
