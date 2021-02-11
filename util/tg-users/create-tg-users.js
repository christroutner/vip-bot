/*
  Used to manually create Telegram users. This script is mostly used when
  moving the bot to a new server. That way I can manually import the users.
*/
const mongoose = require('mongoose')

const config = require('../../config')

const TgUser = require('../../src/models/tg-user')

const userObj = {
  username: 'testuser',
  bchAddr: 'bitcoincash:qzjgc7cz99hyh98yp4y6z5j40uwnd78fw5lx2m4k9t',
  slpAddr: 'simpleledger:qzjgc7cz99hyh98yp4y6z5j40uwnd78fw5napqqkm4',
  merit: 356631,
  hasVerified: true,
  lastVerified: '2021-01-28T01:27:39.465Z',
  tgId: 649043967
}

async function addUser () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(
    config.database,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )

  const newUser = new TgUser(userObj)
  await newUser.save()

  mongoose.connection.close()
}
addUser()
