/*
  Generate a JSON file of all Telegram users. This file can be used to import
  the users into a new database.
*/

// Global npm libraries
const mongoose = require('mongoose')

// Local libraries
const config = require('../../config')
const TgUser = require('../../src/adapters/localdb/models/tg-user')
const JsonFiles = require('../../src/adapters/json-files')

async function getUsers () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, { useNewUrlParser: true })

  const users = await TgUser.find({})
  console.log(`tg-user: ${JSON.stringify(users, null, 2)}`)

  // Write out the data to a JSON file
  const jsonFiles = new JsonFiles()
  await jsonFiles.writeJSON(users, './tg-user-data.json')

  mongoose.connection.close()
}
getUsers()
