/*
  This library encapsulates code concerned with MongoDB and Mongoose models.
*/

// Load Mongoose models.
const Users = require('./models/users')
const TGUsers = require('./models/tg-user')

class LocalDB {
  constructor () {
    // Encapsulate dependencies
    this.Users = Users
    this.TGUsers = TGUsers
  }
}

module.exports = LocalDB
