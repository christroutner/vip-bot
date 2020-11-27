/*
  Mocking data for bot unit tests.
*/

const mockMsg = {
  message_id: 103,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606419322,
  text: 'test'
}

const mockUnverifiedUser = {
  username: 'christroutner',
  bchAddr: '',
  slpAddr: '',
  merit: 0,
  hasVerified: false,
  _id: '5fc0037b02da93045b4beaed',
  tgId: 649043967,
  __v: 0,
  save: () => {} // Mock the save() function.
}

const mockVerifiedUser = {
  username: 'christroutner',
  bchAddr: 'bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf',
  slpAddr: 'simpleledger:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqge2g6tnh',
  merit: 94,
  hasVerified: true,
  _id: '5fc0037b02da93045b4beaed',
  tgId: 649043967,
  __v: 0
}

const validVerifyMsg = {
  message_id: 109,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606420420,
  text:
    '/verify bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf IBcj+ShSRIllp0iTqQK49Ltnycg1upaT7dK5CPAwNIBqEtegn305dPBf5IMdx/ScuyOBWPEfOqab2V73TbuK6Us=',
  entities: [{ offset: 0, length: 7, type: 'bot_command' }]
}

const invalidVerifyMsg1 = {
  message_id: 109,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606420420,
  text: '/verify abc',
  entities: [{ offset: 0, length: 7, type: 'bot_command' }]
}

const invalidVerifyMsg2 = {
  message_id: 109,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606420420,
  text:
    '/verify bitcoincash:qpwdyj5adnzf2cruyr5c3lzrlec9hqphzqyzpn0tdf H12345hiaAdi4/s6Dfl6Buzlf0TUgy3RYS52o3mI64/9Cs4BqkZoaZ76jwJr8DTZeHJW0+WFIwYvzkhEUFAHB2g=',
  entities: [{ offset: 0, length: 7, type: 'bot_command' }]
}

const mockHelpCmd = {
  message_id: 164,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606505054,
  text: '/help',
  entities: [{ offset: 0, length: 5, type: 'bot_command' }]
}

const mockGetMeritMsg = {
  message_id: 166,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606505198,
  text: '/merit @christroutner',
  entities: [
    {
      offset: 0,
      length: 6,
      type: 'bot_command'
    },
    {
      offset: 7,
      length: 14,
      type: 'mention'
    }
  ]
}

const getMeritUserNotFound = {
  message_id: 168,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606505522,
  text: '/merit @someone',
  entities: [
    {
      offset: 0,
      length: 6,
      type: 'bot_command'
    },
    {
      offset: 7,
      length: 8,
      type: 'mention'
    }
  ]
}

const getMeritInvalidArgs = {
  message_id: 170,
  from: {
    id: 649043967,
    is_bot: false,
    first_name: 'Chris',
    last_name: 'Troutner',
    username: 'christroutner',
    language_code: 'en'
  },
  chat: {
    id: -1001337281108,
    title: 'trout-test',
    username: 'trout_test',
    type: 'supergroup'
  },
  date: 1606505756,
  text: '/merit some invalid arguments',
  entities: [
    {
      offset: 0,
      length: 6,
      type: 'bot_command'
    }
  ]
}

module.exports = {
  mockMsg,
  mockUnverifiedUser,
  mockVerifiedUser,
  validVerifyMsg,
  invalidVerifyMsg1,
  invalidVerifyMsg2,
  mockHelpCmd,
  mockGetMeritMsg,
  getMeritUserNotFound,
  getMeritInvalidArgs
}
