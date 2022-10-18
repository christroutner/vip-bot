/*
  This file is used to store unsecure, application-specific data common to all
  environments.
*/

module.exports = {
  port: process.env.PORT || 5001,
  logPass: 'test',
  emailServer: process.env.EMAILSERVER ? process.env.EMAILSERVER : 'mail.someserver.com',
  emailUser: process.env.EMAILUSER ? process.env.EMAILUSER : 'noreply@someserver.com',
  emailPassword: process.env.EMAILPASS ? process.env.EMAILPASS : 'emailpassword',

  // Using constants here so they can be manipulated in tests.
  meritThreshold: 30000,

  restURL: process.env.REST_URL ? process.env.REST_URL : 'https://api.fullstack.cash/v5/',

  // Token ID of the Group token used to generate the NFTs used to gain speak
  // access to the VIP channel.
  tokenId: process.env.TOKEN_ID ? process.env.TOKEN_ID : '5ca1f25b42b13271767eaf3b9fc2e9cf4a1983a364f4f994a4d9bf03edf91c65'
}
