# RC4 Facility Booking Telegram Bot (RC4 CSC Sports Committee 2024)

# Table of Contents

- [Requirements](#requirements)
- [Usage](#usage)

# Requirements

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

To update the types used in the Supabase database,
```{.}
$ export PROJECT_REF={The supabase project reference used}
$ yarn update-types
```
