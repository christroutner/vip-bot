/*
  Telegram User Entity
*/

class TGUser {
  validate ({ username, tgId } = {}) {
    // Input Validation
    if (!username || typeof username !== 'string') {
      throw new Error("Property 'username' must be a string!")
    }
    if (!tgId || typeof tgId !== 'number') {
      throw new Error("Property 'tgId' must be a number!")
    }

    const userData = { username, tgId }

    return userData
  }
}

module.exports = TGUser
