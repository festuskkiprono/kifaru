# Kifaru 4x4 Hire: demo site

Static HTML, CSS and JavaScript. No build step, no framework, no server code.

```
kifaru-site/
├── index.html               Landing page linking both sites
├── theme.js                 Theme switcher shared by both sites
├── client-booking-v2/       Customer site, design v2 (the one the landing page opens)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── photos.js            List of the 40 car photos
│   ├── art.js               Drawn placeholder scene for each of the 10 photo slots
│   ├── credits.html         Photo credits page
│   └── images/              download.sh / download.ps1 fetch the photos into here
├── client-booking/          Customer site, first design (kept for comparison)
└── admin-management/        Staff site
    ├── index.html
    ├── styles.css
    └── app.js
```

## Deploy to Cloudflare Pages

**Option A: upload in the dashboard (no tools needed)**
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (e.g. `kifaru-demo`) and upload the `kifaru-site` folder (or this zip).
3. Deploy. The demo is live at `https://kifaru-demo.pages.dev`.
   - Client: `/client-booking-v2/`
   - Admin: `/admin-management/`

**Option B: Wrangler CLI**
```bash
npm install -g wrangler
wrangler login
wrangler pages deploy ./kifaru-site --project-name kifaru-demo
```

**Option C: from GitHub**
Push the folder to a repo, then in Cloudflare choose **Pages → Connect to Git**. Leave the build command empty and set the output directory to the folder that contains `index.html`.

## Run locally
```bash
cd kifaru-site
python3 -m http.server 8080
# open http://localhost:8080
```
Open it through a local server rather than double-clicking the file, so both sites share the same browser storage.

## Car photos (design v2)
- Each car has 10 photos from Wikimedia Commons. The site first looks for a local file such as `client-booking-v2/images/suzuki-jimny-3-door/01.jpg`. If it is missing, it loads the same photo from Wikimedia Commons. If that fails too, it shows a drawn scene. Each of the 10 slots has its own scene (front, side, rear, dashboard, seats, load area, roof rack, engine, camping, tyres), so the picture visibly changes even before real photos are saved.
- For a faster site, run `bash download.sh` (or `download.ps1` on Windows) inside `client-booking-v2/images/` before you deploy. That saves all 40 photos locally.
- To use your own photos, replace any `NN.jpg` file and update `photos.js` and `credits.html`.
- Keep the credits page: most photos are CC BY-SA and need the author and licence shown.

## Theme switcher
- A **Theme** button sits at the bottom left of Client Booking and Admin Management. Choices: Auto (follows the device), Light, Dark, and five palettes: Savanna, Forest, Ocean, Dusk, Midnight.
- The choice is saved in the browser and shared by both sites. To add a palette, add one entry to `THEMES` in `theme.js`.

## How the demo works
- **Shared bookings:** a booking made on Client Booking is saved in the browser's `localStorage` (key `kifaru-demo-client-bookings`). Admin Management reads it on load, and live when both are open in tabs. It appears as **Committed**, with a unit assigned. Payment codes and cancellations from the client side sync too.
- **Everything else resets on reload** in the admin. There is no database yet.
- **Demo date** is fixed at Wed 4 Nov 2026 in both `app.js` files (`TODAY`), so the example data always lines up.
- **Sign-in** to the admin accepts any email and password. It is not real security.
- **PDFs** (inspection report, upcoming hires) are made in the browser with jsPDF and download straight away.
- **Email:** "Open in email app" opens the staff member's mail app with the subject and message filled in. Attach the downloaded PDF yourself. The full system should email it from the server.
- **WhatsApp** buttons open `wa.me` links. The number `254700000000` is a placeholder: change `WA_NUMBER` in `client-booking-v2/app.js` and the number in Admin → Settings.

## External files loaded
- Google Fonts (Nobile).
- jsPDF 2.5.1 and jsPDF-AutoTable 3.8.2 from cdnjs (admin only).

## Next step for production
Replace the in-browser data with an API (Spring Boot + PostgreSQL) using the same objects: car types, units, bookings, blocks, inspections and settings. Put real authentication on Admin Management.
