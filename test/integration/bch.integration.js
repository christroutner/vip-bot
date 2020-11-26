/*
  Integration tests for the bch.js library.

  This address has been loaded with a little BCH and PSF tokens for testing:
  bitcoincash:qzqeya7lnafh29mggjjnc3hg2hlch4f06ycp6ckstt
  simpleledger:qzqeya7lnafh29mggjjnc3hg2hlch4f06y563rrs44
  1Cp7dYG4Q8YVxwMM2gh9EKr9bwcQ5X1R1E
*/

const assert = require('chai').assert

const BCHLib = require('../../src/lib/bch')
let uut

describe('#bch.js', () => {
  beforeEach(() => {
    uut = new BCHLib()
  })

  describe('#verifyMsg', () => {
    it('should return true for valid signed message', () => {
      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'
      const signedMsg = 'IBcj+ShSRIllp0iTqQK49Ltnycg1upaT7dK5CPAwNIBqEtegn305dPBf5IMdx/ScuyOBWPEfOqab2V73TbuK6Us='

      const verifyObj = { bchAddr, signedMsg }

      const result = uut.verifyMsg(verifyObj)

      assert.equal(result, true)
    })
  })

  describe('#getMerit', () => {
    it('should get the merit for an address', async () => {
      const bchAddr = 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf'

      const result = await uut.getMerit(bchAddr)
      console.log('result: ', result)

      assert.isNumber(result)
    })
  })
})
