/*
  Unit tests for the /verify bot command
*/

// Global npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const FakeTelegramBot = require('../../../mocks/fake-telegram-bot')
const VerifyCommand = require('../../../../../src/controllers/chat-bot/commands/verify')
const mockDataLib = require('../../../mocks/bot-mock')

const wallet = new BchWallet(undefined, { noUpdate: true })

// Mock adapters and use cases
const useCases = {
  tgUser: {
    getUser: async () => {},
    updateUser: async () => {}
  }
}
const adapters = {
  wlogger: {
    debug: () => {},
    error: () => {}
  },
  config: {
    meritThreshold: 30000
  },
  bch: {
    verifyMsg: () => {},
    getMerit: async () => {},
    bchjs: wallet.bchjs
  }
}

describe('#commands-util', () => {
  let sandbox, uut, mockData, bot

  beforeEach(() => {
    bot = new FakeTelegramBot()
    uut = new VerifyCommand({ bot, adapters, useCases })

    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should throw error if bot instance is not passed in', () => {
      try {
        uut = new VerifyCommand()

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'chat bot instance required when instantiating VerifyCommand Class')
      }
    })

    it('should throw error if adapters instance is not passed in', () => {
      try {
        uut = new VerifyCommand({ bot })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Instance of Adapters library required when instantiating VerifyCommand Class.')
      }
    })

    it('should throw error if Use Cases instance is not passed in', () => {
      try {
        uut = new VerifyCommand({ bot, adapters })

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Instance of Use Cases library required when instantiating VerifyCommand Class.')
      }
    })
  })

  describe('#checkDupClaim', () => {
    it('should return false if user matching address is not found in DB', async () => {
      // Force DB returning user-not-found
      sandbox.stub(uut.useCases.tgUser, 'getUser').resolves(null)

      const bchAddr = 'bitcoincash:qzz5tft0pssynhqa2297q2583dmjdql5fvpd876h5k'

      const result = await uut.checkDupClaim(bchAddr, mockData.validVerifyMsg)

      assert.equal(result, false)
    })

    it('should return false if owner issued /verify command', async () => {
      // Force DB to return verified user.
      sandbox.stub(uut.useCases.tgUser, 'getUser').resolves(mockData.mockVerifiedUser)

      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'

      const result = await uut.checkDupClaim(bchAddr, mockData.validVerifyMsg)

      assert.equal(result, false)
    })

    it('should return TG username if address has been claimed', async () => {
      // Force DB to return different user
      mockData.mockVerifiedUser.username = 'testUser'
      sandbox.stub(uut.useCases.tgUser, 'getUser').resolves(mockData.mockVerifiedUser)

      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'

      const result = await uut.checkDupClaim(bchAddr, mockData.validVerifyMsg)

      assert.equal(result, 'testUser')
    })

    it('should catch and report errors', async () => {
      // Force an error
      sandbox.stub(uut.useCases.tgUser, 'getUser').rejects(new Error('test error'))

      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'

      const result = await uut.checkDupClaim(bchAddr, mockData.validVerifyMsg)

      assert.equal(result, 'errorInCheckDupClaim')
    })
  })

  describe('#verifyUser', () => {
    it('should return default message if input is not formatted correctly', async () => {
      // Mock calls to the bot.
      sandbox.stub(uut.bot, 'sendMessage').resolves()
      sandbox.stub(uut.util, 'deleteBotSpam').resolves()

      const result = await uut.process(mockData.invalidVerifyMsg1)
      // console.log('result: ', result)

      assert.equal(result, 0)
    })

    it('should return default message if signature could not be verified', async () => {
      // Mock calls to the bot.
      sandbox.stub(uut.bot, 'sendMessage').resolves()
      sandbox.stub(uut.util, 'deleteBotSpam').resolves()

      const result = await uut.process(mockData.invalidVerifyMsg2)
      // console.log('result: ', result)

      assert.equal(result, 1)
    })

    it('should notify if address does not meet threshold', async () => {
      // Mock to force the code path for this test.
      sandbox.stub(uut.bot, 'sendMessage').resolves()
      sandbox.stub(uut.util, 'deleteBotSpam').resolves()
      sandbox.stub(uut.adapters.bch, 'verifyMsg').returns(true)
      sandbox.stub(uut.useCases.tgUser, 'getUser').resolves(mockData.mockUnverifiedUser)
      sandbox.stub(uut, 'checkDupClaim').resolves(false)
      // Force merit to be below threshold
      sandbox.stub(uut.adapters.bch, 'getMerit').resolves(0.1)

      const result = await uut.process(mockData.validVerifyMsg)

      assert.equal(result, 3)
    })

    it('should send success message if threshold is met', async () => {
      // Mock to force the code path for this test.
      sandbox.stub(uut.bot, 'sendMessage').resolves()
      sandbox.stub(uut.util, 'deleteBotSpam').resolves()
      sandbox.stub(uut.adapters.bch, 'verifyMsg').returns(true)
      sandbox.stub(uut.useCases.tgUser, 'getUser').resolves(mockData.mockUnverifiedUser)
      sandbox.stub(uut, 'checkDupClaim').resolves(false)
      // Force merit to be below threshold
      sandbox.stub(uut.adapters.bch, 'getMerit').resolves(35000)

      const result = await uut.process(mockData.validVerifyMsg)

      assert.equal(result, 2)
    })

    it('should catch and report errors', async () => {
      // Force an error
      sandbox.stub(uut.bot, 'sendMessage').resolves()
      sandbox.stub(uut.util, 'deleteBotSpam').resolves()
      sandbox.stub(uut.adapters.bch, 'verifyMsg').resolves(true)
      sandbox.stub(uut.useCases.tgUser, 'getUser').rejects(new Error('test error'))

      const result = await uut.process(mockData.validVerifyMsg)

      assert.equal(result, 0)
    })

    it('should throw error if the address is already claimed', async () => {
      // Mock to force the code path for this test.
      sandbox.stub(uut.bot, 'sendMessage').resolves()
      sandbox.stub(uut.util, 'deleteBotSpam').resolves()
      sandbox.stub(uut.adapters.bch, 'verifyMsg').resolves(true)
      sandbox.stub(uut.useCases.tgUser, 'getUser').resolves(mockData.mockUnverifiedUser)

      // Report that address has already been claimed.
      sandbox.stub(uut, 'checkDupClaim').resolves('testuser')

      const result = await uut.process(mockData.validVerifyMsg)

      assert.equal(result, 5)
    })
  })
})
