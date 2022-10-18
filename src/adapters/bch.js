/*
  This library contains methods for working with the BCHN and BCHA blockchains.
*/

// Public npm libraries
const BchMerit = require('bch-merit-lib/index')
const BchWallet = require('minimal-slp-wallet')

// Local libraries
const config = require('../../config')

const PSF_TOKEN_ID = '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'

class Bch {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.wallet = new BchWallet(undefined, {
      noUpdate: true,
      interface: 'rest-api',
      restURL: config.restURL
    })
    this.bchjs = this.wallet.bchjs
    this.bchMerit = new BchMerit({ wallet: this.wallet })
    this.config = config
  }

  // Verify that the signed message 'verify' was signed by a specific BCH address.
  verifyMsg (verifyObj) {
    try {
      // Expand the input object.
      const { bchAddr, signedMsg } = verifyObj

      // Convert to BCH address.
      const scrubbedAddr = this.bchjs.SLP.Address.toCashAddress(bchAddr)

      const isValid = this.bchjs.BitcoinCash.verifyMessage(
        scrubbedAddr,
        signedMsg,
        'verify'
      )

      return isValid
    } catch (err) {
      console.error('Error in bch.js/verifyMsg()')
      throw err
    }
  }

  // Calculate and return the merit associated with an SLP address.
  async getMerit (slpAddr) {
    try {
      // Get the aggregated merit of the address.
      const merit = await this.bchMerit.merit.agMerit(slpAddr, PSF_TOKEN_ID)
      console.log(`merit: ${merit}`)

      return merit
    } catch (err) {
      console.error('Error in bch.js/getMerit()')
      throw err
    }
  }

  // Used as a replacement for getMerit. It checks to see if the address contains
  // a specific token.
  async hasToken (addr) {
    try {
      const tokens = await this.wallet.listTokens(addr)
      console.log('tokens: ', tokens)

      const targetToken = tokens.map(x => x.tokenId === this.config.tokenId)

      if (targetToken.length) return 40000

      return 0
    } catch (err) {
      console.error('Error in bch.js/hasToken()')
      throw err
    }
  }
}

module.exports = Bch
