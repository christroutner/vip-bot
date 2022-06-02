/*
  Unit tests for the /help and /start bot commands.
*/

// Global npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

// Local libraries
const FakeTelegramBot = require('../../../mocks/fake-telegram-bot')
const HelpCommand = require('../../../../../src/controllers/chat-bot/commands/help')
const mockDataLib = require('../../../mocks/bot-mock')

describe('#commands-util', () => {
  let sandbox, uut, mockData

  beforeEach(() => {
    const bot = new FakeTelegramBot()
    uut = new HelpCommand({ bot })

    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should throw error if bot instance is not passed in', () => {
      try {
        uut = new HelpCommand()

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'chat bot instance required when instantiating HelpCommand Class')
      }
    })
  })

  describe('#help', () => {
    it('should return message when triggered', async () => {
      // Mock dependencies
      sandbox.stub(uut.util, 'deleteBotSpam').returns()

      const result = await uut.process(mockData.mockHelpCmd)
      // console.log('result: ', result)

      assert.equal(result, undefined)
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.process()

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log(err)

        assert.include(err.message, 'Cannot read')
      }
    })
  })
})
