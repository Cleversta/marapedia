# Marapedia 📖

**The free, community-built encyclopedia for the Mara people.**

Marapedia preserves and shares Mara history, culture, language, songs, and stories — written and read in Mara, English, Myanmar, and Mizo. Anyone can browse for free, and anyone can contribute.

🌐 **[marapedia.org](https://marapedia.org)**
📱 **[Get it on Google Play](https://play.google.com/store/apps/details?id=app.marason.marapedia&pcampaignid=web_share)**

---

## Why Marapedia exists

The Mara people have a rich oral and written tradition — history passed down through elders, songs sung for generations, stories that carry the identity of a community. Much of it has never been written down in a single, accessible place. Marapedia exists to change that: a living, growing archive that anyone in the Mara community can read, and anyone can help build.

## Features

- 🌍 **Four languages** — Mara, English, Myanmar (မြန်မာ), and Mizo
- 📱 **Web and mobile** — read and contribute from a browser or the Flutter app
- ✍️ **Community contributions** — sign up and submit articles, songs, and stories
- 🎵 **Song lyrics with chords** — dedicated formatting for hymns, folk songs, and more
- 📸 **Photo galleries** — preserve visual history alongside the written word
- 📴 **Offline reading** (mobile) — cached articles available without a connection
- 🔍 **Full-text search** across all content and languages
- 🗂️ **Organized by category** — History, Songs, Poems, Stories, Famous People, Villages & Places, Culture, Religion, Language, and more

## Tech stack

**Web** — this repository
- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript
- [Supabase](https://supabase.com) — Postgres database, authentication, row-level security
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — media storage
- Tailwind CSS
- Deployed on [Vercel](https://vercel.com)

**Mobile** — [`marapedia_flutter`](https://github.com/Cleversta/marapedia_flutter)
- Flutter + BLoC
- Same Supabase backend, shared with the web app
- Hive for offline caching

## Contributing

Marapedia is open source and welcomes contributions — whether that's fixing a bug, improving the code, or adding your own knowledge of Mara history and culture directly through the site.

**To contribute content:** sign up at [marapedia.org](https://marapedia.org) and use the "Contribute" button — no coding required.

**To contribute code:**
1. Fork this repository
2. Create a feature branch (`git checkout -b feature/your-idea`)
3. Make your changes
4. Open a pull request describing what you changed and why

For substantial changes, please open an issue first to discuss what you'd like to change.

## Running locally

```bash
git clone https://github.com/Cleversta/marapedia.git
cd marapedia
npm install
```

Create a `.env.local` file with your own Supabase and Cloudflare R2 credentials, then:

```bash
npm run dev
```

## License

This project's source code is open for learning, contribution, and reuse. Content submitted to Marapedia (articles, songs, translations) is the shared cultural heritage of the Mara community — please respect its cultural significance if referencing or reusing it elsewhere.

## About

Built and maintained by [marason](https://github.com/Cleversta), with contributions from the Mara community.

Have questions, feedback, or want to help? Open an issue here, or reach out through the site.
