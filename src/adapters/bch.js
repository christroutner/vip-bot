/*
  This library contains methods for working with the BCHN and BCHA blockchains.
*/

// Public npm libraries
const BCHJS = require('@psf/bch-js')
const BchMessage = require('bch-message-lib')

class Bch {
  constructor (config) {
    // Encapsulate dependencies
    this.bchjs = new BCHJS()
    this.bchMsg = new BchMessage({ bchjs: this.bchjs })
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
      const merit = await this.bchMsg.merit.agMerit(slpAddr)
      console.log(`merit: ${merit}`)

      return merit
    } catch (err) {
      console.error('Error in bch.js/getMerit()')
      throw err
    }
  }
}

module.exports = Bch
