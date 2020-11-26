/*
  Model for telegram users
*/

const mongoose = require('mongoose')

const TGUser = new mongoose.Schema({
  username: { type: String, default: '' },
  tgId: { type: Number },
  bchAddr: { type: String, default: '' },
  slpAddr: { type: String, default: '' },
  merit: { type: Number, default: 0 },
  hasVerified: { type: Boolean, default: false }
})

// export default mongoose.model('user', User)
module.exports = mongoose.model('tg-user', TGUser)
