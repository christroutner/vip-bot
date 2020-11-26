/*
  This library contains methods for working with the BCHN and BCHA blockchains.
*/

// Public npm libraries
const BCHJS = require('@psf/bch-js')

class Bch {
  constructor (config) {
    this.bchjs = new BCHJS()
  }

  // Verify that the signed message 'verify' was signed by a specific BCH address.
  verifyMsg (verifyObj) {
    try {
      // Expand the input object.
      const { bchAddr, signedMsg } = verifyObj

      const isValid = this.bchjs.BitcoinCash.verifyMessage(
        bchAddr,
        signedMsg,
        'verify'
      )

      return isValid
    } catch (err) {
      console.error('Error in bch.js/verifyMsg()')
      throw err
    }
  }
}

module.exports = Bch
