/*
  Unit tests for the bot.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
// const cloneDeep = require('lodash.clonedeep')

// Local libraries
const BotLib = require('../../../../src/controllers/chat-bot')
// const mockDataLib = require('../mocks/bot-mock')
const FakeTelegramBot = require('../../mocks/fake-telegram-bot')

let uut
// let mockData
const useCases = {}

// Mock the adapters.
const adapters = {
  wlogger: {
    debug: () => {},
    error: () => {}
  },
  config: {
    meritThreshold: 30000
  }
}

describe('#chat-bot.js', () => {
  let sandbox

  beforeEach(() => {
    uut = new BotLib({ token: 'fakeToken', chatId: 'fakeId', adapters, useCases })

    // mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(async () => {
    sandbox.restore()

    // await uut.stopBot()
  })

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new BotLib()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating Telegram Bot Controller libraries.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new BotLib({ adapters })

        assert.fail('Unexpected code path')

        // use to prevent complaints from linter.
        console.log('uut: ', uut)
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating Telegram Bot Controller libraries.'
        )
      }
    })

    it('should throw error if Telegram token is not specified', () => {
      try {
        delete process.env.BOTTELEGRAMTOKEN
        delete process.env.CHATID

        uut = new BotLib({ adapters, useCases })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'Bot Telegram token must be passed as BOTTELEGRAMTOKEN environment variable.'
        )
      }
    })

    it('should throw error Telegram chat room ID is not specified', () => {
      try {
        uut = new BotLib({ adapters, useCases, token: 'mockToken' })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'Telegram chat room ID must be passed as CHATID environment variable.'
        )
      }
    })

    it('should accept Telegram properties passed as environment variables', () => {
      process.env.BOTTELEGRAMTOKEN = 'fakeToken'
      process.env.CHATID = 'fakeId'

      uut = new BotLib({ adapters, useCases })

      assert.isOk(uut)
    })
  })

  describe('#startBot', () => {
    it('should start the bot', () => {
      // Mock dependencies
      uut.TelegramBot = FakeTelegramBot

      const result = uut.startBot()
      // console.log('result: ', result)

      assert.isOk(result)
    })

    it('should catch and throw an error', () => {
      try {
        // Force an error.
        uut.TelegramBot = class FakeBot {constructor () { throw new Error('test error') }}

        uut.startBot()

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'test error'
        )
      }
    })
  })

  describe('#processMsg', () => {
    it('should create a new tg-user model on first message from new room participant', async () => {
      // Mock TG message.
      const msg = {
        from: {
          id: 649043967,
          username: 'test'
        },
        chat: {
          id: 649043967
        }
      }

      // Force new user
      uut.useCases.tgUser = {
        getUser: () => false
      }

      // Mock dependencies
      uut.useCases.createUser = () => {}
      uut.bot = new FakeTelegramBot()

      const result = await uut.processMsg(msg)

      assert.equal(result, 1)
    })

    it('should delete the message of an unverified user', async () => {
      // Mock TG message.
      const msg = {
        from: {
          id: 649043967,
          username: 'test'
        },
        chat: {
          id: 649043967
        }
      }

      // Force existing user
      uut.useCases.tgUser = {
        getUser: () => {
          return {
            hasVerified: false
          }
        }
      }

      // Mock dependencies
      uut.bot = new FakeTelegramBot()

      const result = await uut.processMsg(msg)

      assert.equal(result, 2)
    })

    it('should catch and handle an error', async () => {
      const result = await uut.processMsg()

      assert.equal(result, false)
    })
  })
})
