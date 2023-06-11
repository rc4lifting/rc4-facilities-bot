# **NUS Orbital 2023**

# Dplatform

Dplatform is a system designed to manage the bookings of an NUS venue. It automates the underlying workings of the RC4 venue booking system to make booking venues a quick and smooth process for the end user.

# Table of Contents

- [Requirements](#requirements)
- [Usage](#usage)

# Requirements

Dplatform is tested using the following versions:

- Node: v16.20.0
- Yarn: v1.22.19

# Usage

To setup,

```{.}
$ git clone https://github.com/s-kybound/dplatform.git
$ yarn
```

Dplatform uses Jest, a testing framework, to test its validity.

To test,
```{.}
$ export TEST_URL={Your supabase URL here}
$ export TEST_KEY={Your supabase API Key here}
$ yarn test
```

To host the Telegram Bot,
```{.}
$ export BOT_TOKEN={Your Telegram bot Key here}
$ export ELASTICEMAIL_KEY={Elastic Email Key here}
$ export SUPABASE_URL={Your supabase URL here}
$ export SUPABASE_KEY={Your supabase API Key here}
$ export TEST_KEY={Your supabase API Key here}
$ yarn build
$ node ./dist/bot/bot.js
```