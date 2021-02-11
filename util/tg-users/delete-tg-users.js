/*
  Used to manually create Telegram users. This script is mostly used when
  moving the bot to a new server. That way I can manually import the users.
*/
const mongoose = require('mongoose')

const config = require('../../config')

const TgUser = require('../../src/models/tg-user')

async function addUser () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(
    config.database,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )

  const targetUser = await TgUser.findOne({ username: 'testuser' })
  // console.log('targetUser: ', targetUser)

  await targetUser.remove()

  mongoose.connection.close()
}
addUser()
