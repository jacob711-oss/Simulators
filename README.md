# Simulators on its own server

This branch (`server`) is the whole Simulators site plus Quasar's server. It runs on Cloudflare Pages:
- the site is served at the top of your own address
- `functions/` adds Quasar's web search, page reading and AI relay, plus a file storage area

Quasar finds the server by itself when it runs there.

## 1. Put the site on the server (free, about 5 minutes)

1. Make a free Cloudflare account: https://dash.cloudflare.com/sign-up
2. In the dashboard choose **Workers & Pages**, then **Create**, then the **Pages** tab, then **Connect to Git**.
3. Connect your GitHub account and pick the **Simulators** repository.
4. Settings:
   - **Production branch:** `server`
   - **Framework preset:** None
   - **Build command:** leave it empty
   - **Build output directory:** `/`
5. Press **Save and Deploy**. After about a minute your site is live at an address like `https://simulators-xyz.pages.dev`. That is your new link to the whole site.

Every time the site is updated, the `server` branch changes and Cloudflare puts the new version online by itself.

## 2. Add the storage (50 GB or more)

Cloudflare's file storage is called **R2**. The first 10 GB are free; after that it costs about US$0.015 per GB each month (50 GB is about US$0.60 a month). R2 has no size limit, so it grows as you need. Turning R2 on asks for a payment card, even for the free part.

1. In the dashboard choose **R2 Object Storage**, turn it on, then **Create bucket**. Name it `quasar-storage`.
2. Open your Pages project, then **Settings**, then **Bindings** (or **Functions**, then **R2 bucket bindings**).
3. Add an **R2 bucket** binding: variable name `STORAGE`, bucket `quasar-storage`.
4. Under **Settings**, then **Variables and Secrets**, add a secret named `STORAGE_KEY` and choose a long password. Anyone who uploads or deletes files must send this password.
5. Redeploy: open **Deployments**, find the latest one and choose **Retry deployment**.

Using the storage:
- `GET /api/files`: list the files
- `GET /api/files/<name>`: download a file
- `PUT /api/files/<name>`: upload a file; send the header `X-Storage-Key: <your password>`
- `DELETE /api/files/<name>`: delete a file; needs the same header

## 3. Optional: better AI answers with your own OpenAI key

Add a secret named `OPENAI_API_KEY` in the same **Variables and Secrets** place, then redeploy. Quasar's answers then come from OpenAI (model `gpt-4o-mini`; set `OPENAI_MODEL` to choose another). Never paste the key into Quasar itself.

## Quick checks once it is live

- `https://<your-address>/` shows the Simulators hub
- `https://<your-address>/search?q=mars` shows search results
- `https://<your-address>/quasar/` is Quasar, using the server by itself
