# Browser smoke tests

These checks exercise the public Dergo24 flows locally without creating shipments, quotes, accounts, claims, or other production data.

## Run in Brave on Windows

1. Start the app with `npm run dev`.
2. In another terminal, run `npm run test:browser:brave`.

Brave is expected at `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`. Update `playwright-cli.brave.json` if Brave is installed elsewhere.

Generated screenshots, snapshots, and browser logs are written to `output/playwright/` and ignored by Git.
