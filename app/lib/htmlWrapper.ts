/**
 * Wraps HTML content with styles and scripts for rendering in WebView
 * Used for quiz questions, explanations, and hints
 */

interface WrapHtmlOptions {
  isDark?: boolean;
}

export function wrapHtmlContent(content: string, options: WrapHtmlOptions = {}): string {
  const { isDark = false } = options;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    /* Reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Base styles */
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    body {
      padding: 0;
      margin: 0;
      background-color: transparent;
      color: ${isDark ? '#f5f5f4' : '#1f2937'};
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .content-wrapper {
      padding: 12px;
      width: 100%;
      box-sizing: border-box;
    }

    /* Ensure all block elements respect container width */
    * {
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Typography */
    h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 16px;
      margin-top: 24px;
      color: inherit;
    }

    h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      margin-top: 20px;
      color: inherit;
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
      margin-top: 16px;
      color: inherit;
    }

    h4 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      margin-top: 14px;
      color: inherit;
    }

    h5 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
      margin-top: 12px;
      color: inherit;
    }

    h6 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
      margin-top: 10px;
      color: inherit;
    }

    p {
      margin-bottom: 12px;
      font-size: 16px;
      line-height: 24px;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
    }

    li {
      margin-bottom: 6px;
      line-height: 24px;
    }

    /* Text formatting */
    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    s {
      text-decoration: line-through;
    }

    /* Code blocks */
    code {
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: ${isDark ? '#334155' : '#f3f4f6'};
      color: ${isDark ? '#e2e8f0' : 'inherit'};
    }

    pre {
      background-color: ${isDark ? '#334155' : '#f3f4f6'};
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 12px;
      max-width: 100%;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre code {
      background-color: transparent;
      padding: 0;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid #06B6D4;
      padding-left: 16px;
      margin: 12px 0;
      background-color: ${isDark ? '#334155' : '#f0f9ff'};
      padding: 12px 16px;
      border-radius: 8px;
    }

    /* Links */
    a {
      color: ${isDark ? '#22d3ee' : '#06B6D4'};
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Highlight */
    mark {
      border-radius: 2px;
      padding: 2px 4px;
    }

    /* Images */
    img {
      max-width: 100% !important;
      width: auto;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
      display: block;
    }

    /* Tables */
    table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      display: block;
      overflow-x: auto;
    }

    th,
    td {
      border: 1px solid ${isDark ? '#334155' : '#e5e7eb'};
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: ${isDark ? '#1e293b' : '#f3f4f6'};
      font-weight: 600;
    }

    /* Math (KaTeX) */
    .katex {
      font-size: 1.1em;
      color: inherit;
    }

    .math-inline {
      display: inline-block;
      margin: 0 2px;
    }
  </style>

  <!-- KaTeX for LaTeX rendering -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
</head>
<body>
  <div class="content-wrapper">
    ${content}
  </div>

  <script>
    // Auto-render LaTeX when page loads
    document.addEventListener("DOMContentLoaded", function() {
      if (window.renderMathInElement) {
    // Select only elements with class math-inline or math-display
    const mathElements = document.querySelectorAll(".math-inline, .math-display");
    mathElements.forEach(el => {
      renderMathInElement(el, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "$", right: "$", display: false},
          {left: "\\[", right: "\\]", display: true},
          {left: "\\(", right: "\\)", display: false}
        ],
        throwOnError: false
      });
    });
  }
    });

    // Listen for theme changes from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setTheme') {
          // Update colors dynamically
          if (data.theme === 'dark') {
            document.body.style.color = '#f5f5f4';
          } else {
            document.body.style.color = '#1f2937';
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    });
  </script>
</body>
</html>`;
}
