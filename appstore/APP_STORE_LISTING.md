# Field Oracle — App Store Connect listing draft

Draft copy + privacy questionnaire answers for the first submission. Everything
here is editable — nothing is final until you paste it into App Store Connect.

## App name & subtitle

- **Name** (30 char max): `Field Oracle` (12 chars — room to spare if you want
  to add something, but plain is fine and matches the repo/README as-is)
- **Subtitle** (30 char max, shows under the name in search): pick one —
  - `I Ching as a state engine` (26 chars)
  - `Sample the field, not fate` (27 chars)
  - `Continuous I Ching casting` (26 chars)

## Promotional text (170 char max, editable anytime without review)

> Cast one hexagram, a field of a thousand, or watch a continuous stream —
> the same mechanics at three resolutions. Not fortune-telling. A state
> engine.

## Description (4000 char max)

> Field Oracle (FO-64) reads the I Ching as a **state engine**, not a
> fortune-telling device — sampling structure space at three resolutions:
>
> • **Single cast** — a point reading. Three-coin method, King Wen sequence,
>   the same math diviners have used for millennia.
> • **Field (×1000)** — cast a large ensemble at once and read the aggregate
>   weather: which hexagrams cluster, which trigrams dominate, where the
>   yin-yang tilt sits.
> • **Cascade** — a continuous stream. Watch tilt (yang/yin polarity drift),
>   churn (moving-line rate), recurrence (a hexagram repeating above its
>   1-in-64 chance rate), and hot lines (a position staying in motion)
>   develop in real time.
>
> Each hexagram is treated as one of 64 types of time — a configuration of
> change latently present everywhere. Casting doesn't create the reading;
> it's a sampling method that selects which configuration is amplified right
> now. The instrument panel is built around that framing: what it shows you
> is where the field currently sits and where it's moving, not a verdict.
>
> **Honest footing.** This is a contemplative instrument amplified by
> structured randomness. The statistical flags (recurrence, hot lines, runs)
> will fire at their chance baselines in a genuinely random stream — every
> readout states its baseline for exactly that reason. The app includes an
> optional, preregistered LAB mode for testing whether intent biases the
> sampling stream beyond chance; results are honestly reported including
> null results, and the methodology is documented in the open-source repo.
>
> No accounts, no ads, no tracking. An optional sync key lets you carry a
> personal reading log across devices — the key itself is the only
> credential, chosen by you, never tied to your identity.

## Keywords (100 char max, comma-separated)

```
i ching,iching,hexagram,divination,oracle,king wen,coins,cascade,random,contemplative
```

## Category

- Primary: **Lifestyle**
- Secondary: **Reference** (or **Utilities** if Lifestyle+Reference isn't
  available as a pair on your account type)

## Age rating

Nothing in the app should trip content flags (no user-generated content
visible to other users, no violence/gambling/mature themes). The three
outbound links (Ko-fi, Guerilla Concerto, Diviners Guild) are fixed
destinations, not general browsing, so **answer "No" to Unrestricted Web
Access** on the questionnaire. Expected result: **4+**.

## Support URL / Marketing URL

- Support & marketing: `https://heyneeff.github.io/field-oracle/` (confirm
  this is actually where GitHub Pages serves it — it's the CORS-allowed
  origin in `worker/src/index.js`, so it should be live already)
- Consider linking `README.md` or a short static support page for the
  Support URL specifically, since Apple sometimes asks it to be a real
  contact/help page rather than the app's own landing page.

## Privacy — "App Privacy" questionnaire (Data collection)

Based on `worker/schema.sql` and `worker/src/index.js` — the only backend
this app talks to. No analytics SDKs, no ad networks, no third-party
trackers of any kind.

| Data type | Collected? | Linked to identity? | Used for tracking? | Purpose |
|---|---|---|---|---|
| User Content — the question you type, cast results | Yes, only if you use Sync/Lab | **No** — tied only to a self-chosen `sync_key`, never to Apple ID, device ID, or account | No | App Functionality |
| Identifiers | No Apple ID / device ID / advertising ID collected. The `sync_key` is user-generated opaque text, not an Apple-defined identifier type — Apple's form asks about *their* identifier categories (Device ID, User ID tied to account, etc.), which don't apply here | — | No | — |
| Diagnostics/Usage/Analytics | No | — | No | — |
| Location, Contacts, Financial, Health, etc. | No | — | No | — |

**Recommended answer at the top level: "Data Not Collected" is too strong**
(the Lab/Sync features do send data to your Worker) **but every category
should be "Data Not Linked to You"** — nothing collected can be traced back
to a person, only to a key the person invented themselves. No data is used
for tracking (no cross-app/cross-site identifiers, no ad targeting).

One caveat worth flagging honestly in the questionnaire: IP addresses are
processed transiently server-side (hashed before storage, per
`worker/README.md`) for rate-limiting. Apple's form has a specific line for
this — if it asks about IP address collection, answer "Collected, not
linked to identity, used for App Functionality (rate limiting/security)."

## One blocker found and fixed in code, not yet deployed

The Worker's CORS allowlist (`worker/src/index.js`) only permitted
`https://heyneeff.github.io` and localhost — a native iOS build's WKWebView
sends `Origin: capacitor://localhost`, which would have been silently
blocked, breaking Sync and Lab inside the shipped app (the single-cast/field
modes don't touch the network, so those would've still worked — only
sync-log and lab-submit/stats would've silently failed). Fixed in this
branch by adding `capacitor://localhost` (and `https://localhost` for a
future Android build) to the allowlist — **not yet deployed**, since that
touches the live production Worker. Run `npx wrangler deploy` from
`worker/` when you're ready (needs your Cloudflare login).
