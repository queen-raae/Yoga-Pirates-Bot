# Yoga Pirates Discord.js Bot

A bot to save yoga sessions to an sqlite-database using Discord messages.

## ✅ How to log

Write a log message in the #yoga channel.

- `✅ Center Day 6 - Good session` // Save a record to the database with date = now and note = "Center Day 6 - Good session"
- `✅-1 Extra evening Session` // Save a record to database with date = now - 24 hours day and note = "Extra evening Session"

## 💁‍♀️ How to dev

- Get env variables from @raae
- Install dependencies `yarn`
- Start the bot `yarn dev`
- Start the bot with `DEPLOY_COMMANDS=true` set to deploy commands, but do not do this on every code change.

## 🤖 How to deploy

- Set environment variable `DEPLOY_COMMANDS=true` to automatically deploy the commands on start.

## 👑 Stay updated

Stay updated about side projects and other shenanigans from Queen Raae (and her piratical family) by [subscribing](https://queen.raae.codes/emails/?utm_source=github&utm_campaign=yoga+pirates&utm_medium=readme) to our newsletter.
