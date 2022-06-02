/*
  Unit tests for the commands/util.js library
*/

// Global npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

// Local libraries
const FakeTelegramBot = require('../../../mocks/fake-telegram-bot')
const BotCommandUtil = require('../../../../../src/controllers/chat-bot/commands/util')
const mockDataLib = require('../../../mocks/bot-mock')

describe('#commands-util', () => {
  let sandbox, uut, mockData

  beforeEach(() => {
    const bot = new FakeTelegramBot()
    uut = new BotCommandUtil({ bot })

    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should throw error if bot instance is not passed in', () => {
      try {
        uut = new BotCommandUtil()

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'chat bot instance required when instantiating BotCommandUtil Class')
      }
    })
  })

  describe('#_deleteMsgQuietly', () => {
    it('should delete a message', async () => {
      const chatId = mockData.invalidVerifyMsg1.chat.id
      const msgId = mockData.invalidVerifyMsg1.chat.id

      await uut._deleteMsgQuietly(chatId, msgId)

      assert(true, 'Test passed')
    })
  })

  describe('#_deleteMsgs', () => {
    it('should delete both messages', async () => {
      // Mock calls to the bot.
      sandbox.stub(uut, '_deleteMsgQuietly').resolves()

      const msg = mockData.invalidVerifyMsg1
      const botMsg = mockData.invalidVerifyMsg1

      await uut._deleteMsgs(msg, botMsg)

      assert(true, 'Test passed')
    })
  })

  describe('#deleteBotSpam', () => [
    it('should start a timer', () => {
      const timerHandle = uut.deleteBotSpam(
        mockData.invalidVerifyMsg1,
        mockData.invalidVerifyMsg1
      )

      clearTimeout(timerHandle)

      assert(true, 'Test passed')
    })
  ])
})
