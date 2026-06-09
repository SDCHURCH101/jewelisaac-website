# Jewel Isaac, LLC — Website

Marketing site for **Jewel Isaac, LLC**, an Alaska construction company serving
commercial, government, industrial, mining, and oil & gas markets statewide.

Static HTML/CSS/JS — no build step or framework. Shared design system in
`assets/styles.css` and behavior in `assets/app.js`.

**Pages:** `index.html` (home), `markets.html`, `projects.html`, `safety.html`,
`about.html`, `contact.html` (request-a-bid form).

**Hosting:** GitHub Pages from `main` / root. Custom domain in `CNAME`.

**Contact form:** runs in demo mode (client-side validation + success panel).
To receive submissions, wire Netlify Forms / Formspree / a backend endpoint and
remove `data-demo="true"` — see the comments in `contact.html` and `assets/app.js`.
