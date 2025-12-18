// clean-html.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

const input = "1.html";       // your exported file
const output = "clean.html";  // result

const html = fs.readFileSync(input, "utf8");
const dom = new JSDOM(html);
const doc = dom.window.document;

// 1. Remove all scripts
doc.querySelectorAll("script").forEach(el => el.remove());

// 2. Keep only your CSS (remove _next, preload etc.)
// If you want to keep inline <style> (like ProseMirror styles), skip those
doc.querySelectorAll("link[rel=stylesheet]").forEach(el => {
  if (el.href.includes("_next")) el.remove();
});
doc.querySelectorAll("link[rel=preload]").forEach(el => el.remove());

// 3. Remove chrome extension junk
doc.querySelectorAll("[src^='chrome-extension://']").forEach(el => el.remove());

// 4. Remove React/Next hydration attributes
doc.querySelectorAll("[data-next-hide-fouc], [data-rht-toaster]").forEach(el => el.remove());

// 5. Strip big wrappers if you only need the main article
const main = doc.querySelector("main") || doc.body;
const content = main.innerHTML;

// Build minimal HTML
const cleanHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Lesson</title>
  <link rel="stylesheet" href="katex.min.css">
  <style>
    body { font-family: sans-serif; padding: 16px; background: #fff; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${content}
</body>
</html>
`;

fs.writeFileSync(output, cleanHTML, "utf8");
console.log("✅ Cleaned file saved:", output);
