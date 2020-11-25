# VIP Bot
This repository is forked from [koa-api-boilerplate](https://github.com/christroutner/koa-api-boilerplate). It creates a REST API server that also functions as Telegram bot. The purpose of the bot is to manage a Telegram channel. The purpose of the channel is to be a VIP (very important person) room, which is publically viewable, but anyone who wants to speak must prove that they own a certain number of [PSF tokens](https://psfoundation.cash).

If you don't prove to the bot that you own the tokens by signing a message, then any message you write will be immediately deleted. Once you've certified with the bot, you'll be allowed to talk in the channel.

## License
MIT
