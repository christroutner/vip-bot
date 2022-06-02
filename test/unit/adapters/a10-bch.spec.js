/*
  Integration tests for the bch.js library.

  This address has been loaded with a little BCH and PSF tokens for testing:
  bitcoincash:qzqeya7lnafh29mggjjnc3hg2hlch4f06ycp6ckstt
  simpleledger:qzqeya7lnafh29mggjjnc3hg2hlch4f06y563rrs44
  1Cp7dYG4Q8YVxwMM2gh9EKr9bwcQ5X1R1E
*/

// Global npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Local libraries
const BCHLib = require('../../../src/adapters/bch')

describe('#bch.js', () => {
  let sandbox, uut

  beforeEach(() => {
    uut = new BCHLib()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#verifyMsg', () => {
    it('should return true for valid signed message', () => {
      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'
      const signedMsg =
        'IBcj+ShSRIllp0iTqQK49Ltnycg1upaT7dK5CPAwNIBqEtegn305dPBf5IMdx/ScuyOBWPEfOqab2V73TbuK6Us='

      const verifyObj = { bchAddr, signedMsg }

      const result = uut.verifyMsg(verifyObj)

      assert.equal(result, true)
    })

    it('should return false for invalid signed message', () => {
      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'
      const signedMsg =
        'ICcj+ShSRIllp0iTqQK49Ltnycg1upaT7dK5CPAwNIBqEtegn305dPBf5IMdx/ScuyOBWPEfOqab2V73TbuK6Us='

      const verifyObj = { bchAddr, signedMsg }

      const result = uut.verifyMsg(verifyObj)

      assert.equal(result, false)
    })

    it('should catch and throw errors', () => {
      try {
        // Force an error
        sandbox
          .stub(uut.bchjs.BitcoinCash, 'verifyMessage')
          .throws(new Error('test error'))

        const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'
        const signedMsg =
          'ICcj+ShSRIllp0iTqQK49Ltnycg1upaT7dK5CPAwNIBqEtegn305dPBf5IMdx/ScuyOBWPEfOqab2V73TbuK6Us='

        const verifyObj = { bchAddr, signedMsg }

        uut.verifyMsg(verifyObj)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getMerit', () => {
    it('should get the merit for an address', async () => {
      // Mock to prevent live network calls.
      sandbox.stub(uut.bchMerit.merit, 'agMerit').resolves(50)

      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'

      const result = await uut.getMerit(bchAddr)

      assert.isNumber(result)
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.bchMerit.merit, 'agMerit')
          .throws(new Error('test error'))

        const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'

        await uut.getMerit(bchAddr)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })
})
