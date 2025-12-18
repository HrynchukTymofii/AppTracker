/**
 * Utility to fetch and render TipTap lessons to complete HTML with CSS
 * This pre-renders lessons from your website so they can be stored in the database
 */

import axios from "axios";

const API_BASE_URL = "https://www.satlearner.com";

interface LessonHtmlResult {
  html: string;
  css: string;
  combinedHtml: string;
}

/**
 * Converts TipTap JSON content to HTML
 */
function tiptapToHtml(content: any): string {
  if (!content || !content.content) return "";

  let html = "";

  for (const node of content.content) {
    html += renderNode(node);
  }

  return html;
}

function renderNode(node: any): string {
  if (!node || !node.type) return "";

  switch (node.type) {
    case "paragraph":
      const pContent = node.content?.map(renderNode).join("") || "";
      return `<p>${pContent}</p>`;

    case "heading":
      const level = node.attrs?.level || 1;
      const hContent = node.content?.map(renderNode).join("") || "";
      return `<h${level}>${hContent}</h${level}>`;

    case "text":
      return renderText(node);

    case "bulletList":
      const ulContent = node.content?.map(renderNode).join("") || "";
      return `<ul>${ulContent}</ul>`;

    case "orderedList":
      const olContent = node.content?.map(renderNode).join("") || "";
      return `<ol>${olContent}</ol>`;

    case "listItem":
      const liContent = node.content?.map(renderNode).join("") || "";
      return `<li>${liContent}</li>`;

    case "blockquote":
      const bqContent = node.content?.map(renderNode).join("") || "";
      return `<blockquote>${bqContent}</blockquote>`;

    case "codeBlock":
      const codeContent = node.content?.map((n: any) => n.text || "").join("") || "";
      return `<pre><code>${escapeHtml(codeContent)}</code></pre>`;

    case "inlineMath":
      const latex = node.attrs?.latex || "";
      return `<span class="math-inline">$${escapeHtml(latex)}$</span>`;

    case "image":
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;

    case "hardBreak":
      return "<br>";

    default:
      return "";
  }
}

function renderText(node: any): string {
  let text = escapeHtml(node.text || "");
  const marks = node.marks || [];

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        text = `<strong>${text}</strong>`;
        break;
      case "italic":
        text = `<em>${text}</em>`;
        break;
      case "underline":
        text = `<u>${text}</u>`;
        break;
      case "strike":
        text = `<s>${text}</s>`;
        break;
      case "code":
        text = `<code>${text}</code>`;
        break;
      case "link":
        const href = mark.attrs?.href || "#";
        text = `<a href="${escapeHtml(href)}">${text}</a>`;
        break;
      case "highlight":
        const color = mark.attrs?.color || "#fef08a";
        text = `<mark style="background-color: ${escapeHtml(color)}">${text}</mark>`;
        break;
      case "textStyle":
        const styles: string[] = [];
        if (mark.attrs?.color) styles.push(`color: ${escapeHtml(mark.attrs.color)}`);
        if (mark.attrs?.fontSize) styles.push(`font-size: ${escapeHtml(mark.attrs.fontSize)}`);
        if (mark.attrs?.fontFamily) styles.push(`font-family: ${escapeHtml(mark.attrs.fontFamily)}`);
        if (styles.length > 0) {
          text = `<span style="${styles.join("; ")}">${text}</span>`;
        }
        break;
    }
  }

  return text;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Fetches lesson content from API and renders TipTap JSON to HTML
 */
export async function fetchRenderedLessonHtml(
  chapterId: string,
  lessonId: string,
  lessonContent?: any
): Promise<LessonHtmlResult | null> {
  try {
    // If lesson content is provided, use it directly
    let contentJson = lessonContent;

    // Otherwise, fetch it from the API
    if (!contentJson) {
      //console.log(`📡 Fetching lesson content for ${lessonId}...`);
      const url = `${API_BASE_URL}/api/user/course/chapters`;
      const response = await axios.get(url);

      // Find the chapter and lesson
      const chapter = response.data.find((c: any) => c.id === chapterId);
      if (!chapter) {
        console.error(`❌ Chapter ${chapterId} not found`);
        return null;
      }

      const lesson = chapter.lessons?.find((l: any) => l.id === lessonId);
      if (!lesson || !lesson.content) {
        console.error(`❌ Lesson ${lessonId} not found or has no content`);
        return null;
      }

      contentJson = lesson.content;
    }

    // Parse content if it's a string
    const content = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;

    // Convert TipTap JSON to HTML
    const contentHtml = tiptapToHtml(content);

    if (!contentHtml) {
      console.warn(`⚠️ No HTML content generated for lesson ${lessonId}`);
      return null;
    }

    // Create a self-contained HTML document
    const combinedHtml = createSelfContainedHtml(contentHtml, "");

    return {
      html: contentHtml,
      css: "",
      combinedHtml,
    };
  } catch (error) {
    console.error(`❌ Failed to render lesson ${lessonId}:`, error);
    return null;
  }
}

/**
 * Creates a complete HTML document with embedded CSS and dark mode support
 */
function createSelfContainedHtml(content: string, css: string): string {
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
    }

    body {
      padding: 0;
      margin: 0;
      background-color: transparent;
    }

    /* Light mode (default) */
    body {
      color: #1f2937;
      background-color: #ffffff;
    }

    /* Dark mode */
    body.dark-mode {
      color: #f5f5f4;
      background-color: #1e293b;
    }

    /* Content wrapper */
    .expo-content {
      padding: 0;
      width: 100%;
    }

    /* Typography */
    .expo-content h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 16px;
      margin-top: 24px;
      color: inherit;
    }

    .expo-content h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      margin-top: 20px;
      color: inherit;
    }

    .expo-content h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
      margin-top: 16px;
      color: inherit;
    }

    .expo-content p {
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 24px;
    }

    .expo-content ul, .expo-content ol {
      margin-left: 20px;
      margin-bottom: 16px;
    }

    .expo-content li {
      margin-bottom: 8px;
      line-height: 24px;
    }

    /* Code blocks */
    .expo-content code {
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: #f3f4f6;
    }

    body.dark-mode .expo-content code {
      background-color: #334155;
      color: #e2e8f0;
    }

    .expo-content pre {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 16px;
    }

    body.dark-mode .expo-content pre {
      background-color: #334155;
    }

    .expo-content pre code {
      background-color: transparent;
      padding: 0;
    }

    /* Blockquotes */
    .expo-content blockquote {
      border-left: 4px solid #06B6D4;
      padding-left: 16px;
      margin: 16px 0;
      background-color: #f0f9ff;
      padding: 12px 16px;
      border-radius: 8px;
    }

    body.dark-mode .expo-content blockquote {
      background-color: #334155;
      border-left-color: #06B6D4;
    }

    /* Links */
    .expo-content a {
      color: #06B6D4;
      text-decoration: none;
    }

    .expo-content a:hover {
      text-decoration: underline;
    }

    body.dark-mode .expo-content a {
      color: #22d3ee;
    }

    /* Images */
    .expo-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 16px 0;
    }

    /* Tables */
    .expo-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    .expo-content th,
    .expo-content td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }

    body.dark-mode .expo-content th,
    body.dark-mode .expo-content td {
      border-color: #334155;
    }

    .expo-content th {
      background-color: #f3f4f6;
      font-weight: 600;
    }

    body.dark-mode .expo-content th {
      background-color: #1e293b;
    }

    /* Math (KaTeX) */
    .katex {
      font-size: 1.1em;
    }

    body.dark-mode .katex {
      color: #f5f5f4;
    }

    /* Original CSS from the page */
    ${css}
  </style>

  <!-- KaTeX for LaTeX rendering (if needed) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
</head>
<body>
  <div class="expo-content p-4">
    ${content}
  </div>

  <script>
    // Auto-render LaTeX when page loads
    document.addEventListener("DOMContentLoaded", function() {
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\\\[", right: "\\\\]", display: true},
            {left: "\\\\(", right: "\\\\)", display: false}
          ],
          throwOnError: false
        });
      }
    });

    // Listen for theme changes from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setTheme') {
          if (data.theme === 'dark') {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
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

/**
 * Batch process all lessons for a chapter
 */
export async function renderAllLessonsForChapter(
  chapterId: string,
  lessonIds: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const lessonId of lessonIds) {
    const result = await fetchRenderedLessonHtml(chapterId, lessonId);
    if (result) {
      results.set(lessonId, result.combinedHtml);
      //console.log(`✅ Rendered lesson ${lessonId}`);
    } else {
      console.warn(`⚠️ Failed to render lesson ${lessonId}`);
    }
  }

  return results;
}
