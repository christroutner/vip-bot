/*
  Import a JSON file to populate a new database with Telegram users.

  This allows the moving of one installation to another one.
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

  // Read in the imported datafile
  const jsonFiles = new JsonFiles()
  const importedData = await jsonFiles.readJSON('./tg-user-data.json')
  console.log('importedData: ', JSON.stringify(importedData, null, 2))

  // Add each entry into the database.
  for (let i = 0; i < importedData.length; i++) {
    const thisRecord = importedData[i]

    // Add the user to the database.
    const newUser = new TgUser(thisRecord)
    await newUser.save()
  }

  mongoose.connection.close()
}
getUsers()
