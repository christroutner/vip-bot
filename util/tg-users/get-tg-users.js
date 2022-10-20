const mongoose = require('mongoose')

const config = require('../../config')

const User = require('../../src/adapters/localdb/models/tg-user')

async function getUsers () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, { useNewUrlParser: true })

  const users = await User.find({}, '-password')
  console.log(`tg-user: ${JSON.stringify(users, null, 2)}`)

  mongoose.connection.close()
}
getUsers()
