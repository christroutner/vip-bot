/*
  This library contains business-logic for dealing with users. Most of these
  functions are called by the /user REST API endpoints.
*/

const TGUserEntity = require('../entities/tg-user')
const wlogger = require('../adapters/wlogger')

class UserLib {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating User Use Cases library.'
      )
    }

    // Encapsulate dependencies
    this.TGUserEntity = new TGUserEntity()
    this.TGUserModel = this.adapters.localdb.TGUsers
  }

  // Create a new user model and add it to the Mongo database.
  async createUser (userObj) {
    try {
      // Input Validation

      const TGUserEntity = this.TGUserEntity.validate(userObj)
      const user = new this.TGUserModel(TGUserEntity)

      // Save the new user model to the database.
      await user.save()

      // Convert the database model to a JSON object.
      const userData = user.toJSON()

      return userData
    } catch (err) {
      // console.log('createUser() error: ', err)
      wlogger.error('Error in use-cases/tg-user.js/createUser()')
      throw err
    }
  }

  // Returns an array of all user models in the Mongo database.
  async getAllUsers () {
    try {
      // Get all user models. Delete the password property from each model.
      const users = await this.TGUserModel.find({})

      return users
    } catch (err) {
      wlogger.error('Error in use-cases/users.js/getAllUsers()')
      throw err
    }
  }

  // Get the model for a specific user.
  async getUser (id) {
    try {
      if (!id) throw new Error('id required when querying user.')

      const user = await this.TGUserModel.findOne({ tgId: id })

      // Return null if user is not found (new user).
      if (!user) {
        return null
      }

      return user
    } catch (err) {
      console.log('Error in use-cases/tg-user.js/getUser()')

      throw err
    }
  }

  // This still needs to be refactored. It's copied from user.js.
  async updateUser (existingUser, newData) {
    try {
      // console.log('existingUser: ', existingUser)
      // console.log('newData: ', newData)

      // Input Validation
      // Optional inputs, but they must be strings if included.
      if (newData.email && typeof newData.email !== 'string') {
        throw new Error("Property 'email' must be a string!")
      }
      if (newData.name && typeof newData.name !== 'string') {
        throw new Error("Property 'name' must be a string!")
      }
      if (newData.password && typeof newData.password !== 'string') {
        throw new Error("Property 'password' must be a string!")
      }

      // Save a copy of the original user type.
      const userType = existingUser.type
      // console.log('userType: ', userType)

      // If user 'type' property is sent by the client
      if (newData.type) {
        if (typeof newData.type !== 'string') {
          throw new Error("Property 'type' must be a string!")
        }

        // Unless the calling user is an admin, they can not change the user type.
        if (userType !== 'admin') {
          throw new Error("Property 'type' can only be changed by Admin user")
        }
      }

      // Overwrite any existing data with the new data.
      Object.assign(existingUser, newData)

      // Save the changes to the database.
      await existingUser.save()

      // Delete the password property.
      delete existingUser.password

      return existingUser
    } catch (err) {
      wlogger.error('Error in lib/users.js/updateUser()')
      throw err
    }
  }

  async deleteUser (user) {
    try {
      await user.remove()
    } catch (err) {
      wlogger.error('Error in lib/users.js/deleteUser()')
      throw err
    }
  }
}

module.exports = UserLib
