# User Manual — GhanaPay Mobile

A guide for using the GhanaPay Mobile wallet app. No technical knowledge required.

**Important**: this is an academic demonstration app. Top-ups don't move
real money from any real bank or mobile money account, bill payments
don't reach real utility companies, and airtime purchases don't credit a
real phone. It's a fully working sandbox for learning how a mobile wallet
app is built.

## Getting started

### Creating an account
1. Go to the app and select **Create one** on the login screen.
2. Enter your full name, email, a Ghanaian phone number, and a password
   (at least 6 characters).
3. Tap **Create Account**. You'll land on your Dashboard right away.

### Logging in
Use your email and password, or tap **Continue with Google**.

### Forgot your password?
Tap **Forgot password?** on the login screen, enter your email, and
check your inbox for a reset link.

## Dashboard

Your Dashboard shows your wallet balance, a quick spending summary, and
your most recent transactions. Tap the eye icon next to your balance to
hide it from view (useful in public).

## Wallet

- **Top Up**: adds sandbox funds to your wallet instantly.
- **Withdraw**: removes funds from your wallet (sandbox — doesn't send
  money anywhere real).
- Your transaction history updates immediately after every action.

## Sending money

1. Go to **Send Money**.
2. Enter the recipient's Ghanaian phone number. The app verifies they
   have a GhanaPay account and shows their name before you confirm.
3. Enter an amount and an optional note, then confirm.
4. Money moves instantly between your wallet and theirs.

You have a daily sending limit shown on the Send Money page — this is
enforced by the app, not just a suggestion.

## Airtime

Go to **Airtime**, choose a network, enter the phone number and amount,
and confirm. Your wallet is debited immediately (no real airtime is
delivered — this is a sandbox).

## Bills

Go to **Bill Payments**, choose a biller, enter your account/meter
number, and an amount. The app shows a verified account name before you
pay (this verification is simulated for demo purposes, not a real check
against your actual utility account).

## Scheduled Payments

Set up a transfer, bill, or airtime payment to repeat automatically —
daily, weekly, monthly, or annually. You don't need to keep the app open;
it runs in the background (as long as the project's automatic scheduler
is properly deployed — see the Administration Guide if payments aren't
firing as expected).

## Identity Verification (KYC)

Higher transaction tiers require identity verification:
1. Go to **KYC Verification**.
2. Upload your Ghana Card, a selfie, and a proof of address, one at a time.
3. An administrator reviews your submission — this can take some time
   since it's a manual review, not automatic.
4. You'll get a notification once it's approved or rejected. If rejected,
   you can re-upload and it goes back into the review queue.

## Statements

Go to **Statements** to see a month-by-month breakdown of your account —
opening/closing balance, total money in/out. You can download a CSV or
use **Print / Save as PDF** to keep a copy. (This isn't a bank-certified
document — it's generated from your in-app transaction history.)

## Notifications

Tap the bell icon in the top bar to see recent activity — top-ups,
transfers, KYC decisions. Tap a notification to mark it read, or use
**Mark all read**.

## Settings

Update your name and phone number under **Settings**. Your email address
can't be changed from this screen for security reasons (changing it
requires re-confirming your identity, which isn't built into this app
yet) — contact support if you need to change it.

## Linking external accounts

Under **Wallet → Link Account**, you can add a mobile money or bank
account. This is a sandbox feature — no real account is contacted or
verified; it's for demonstrating how the feature would work.

## Getting help

This is an academic project without a live support team. If something
isn't working as described here, it may be an intentionally unfinished
feature — check with whoever's presenting/grading this project for
current status.
