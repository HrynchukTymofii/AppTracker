import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";
import Mathematics from "@tiptap/extension-mathematics";
import { Link } from "@tiptap/extension-link";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chapterId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    // Fetch lesson from database
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        content: true,
        description: true,
      },
    });

    if (!lesson || !lesson.content) {
      return new NextResponse("Lesson not found", { status: 404 });
    }

    // Render the TipTap content to static HTML
    // Note: This requires the ReadOnlyEditor component to be server-side compatible
    // If it's not, we'll use a simpler approach below

    // Generate complete HTML document
    const html = generateCompleteHtml(lesson.content, lesson.title);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error exporting lesson:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * Generate a complete HTML document with embedded styles
 */
function generateCompleteHtml(content: string, title: string): string {
  // Parse TipTap JSON and convert to HTML
  let htmlContent = "";

  try {
    const tiptapJson = JSON.parse(content);
    console.log("✅ TipTap JSON parsed successfully");

    // Convert TipTap JSON to HTML using the same extensions as the editor
    htmlContent = generateHTML(tiptapJson, [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Mathematics.configure({
        katexOptions: {
          maxSize: 300,
        },
      }),
      Link.configure({ openOnClick: false }),
    ]);

    console.log("✅ HTML generated successfully, length:", htmlContent.length);
    console.log("First 200 chars:", htmlContent.substring(0, 200));
  } catch (error) {
    console.error("❌ Failed to convert TipTap to HTML:", error);
    console.error("Error details:", (error as Error).message);
    console.error("Stack:", (error as Error).stack);
    // Fallback: use content as-is if it's not valid JSON
    htmlContent = content;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
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
      padding: 16px;
      width: 100%;
      max-width: 768px;
      margin: 0 auto;
    }

    /* TipTap ProseMirror styles */
    .ProseMirror {
      outline: none;
    }

    .ProseMirror > * + * {
      margin-top: 0.75em;
    }

    /* Typography */
    .expo-content h1,
    .ProseMirror h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 16px;
      margin-top: 24px;
      color: inherit;
      line-height: 1.3;
    }

    .expo-content h2,
    .ProseMirror h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      margin-top: 20px;
      color: inherit;
      line-height: 1.3;
    }

    .expo-content h3,
    .ProseMirror h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
      margin-top: 16px;
      color: inherit;
      line-height: 1.4;
    }

    .expo-content h4,
    .ProseMirror h4 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      margin-top: 12px;
      color: inherit;
    }

    .expo-content p,
    .ProseMirror p {
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 24px;
      color: inherit;
    }

    .expo-content ul,
    .expo-content ol,
    .ProseMirror ul,
    .ProseMirror ol {
      margin-left: 20px;
      margin-bottom: 16px;
      padding-left: 8px;
    }

    .expo-content li,
    .ProseMirror li {
      margin-bottom: 8px;
      line-height: 24px;
    }

    .expo-content ul {
      list-style-type: disc;
    }

    .expo-content ol {
      list-style-type: decimal;
    }

    /* Code blocks */
    .expo-content code,
    .ProseMirror code {
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: #f3f4f6;
      color: #374151;
    }

    body.dark-mode .expo-content code,
    body.dark-mode .ProseMirror code {
      background-color: #334155;
      color: #e2e8f0;
    }

    .expo-content pre,
    .ProseMirror pre {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 16px;
    }

    body.dark-mode .expo-content pre,
    body.dark-mode .ProseMirror pre {
      background-color: #334155;
    }

    .expo-content pre code,
    .ProseMirror pre code {
      background-color: transparent;
      padding: 0;
      font-size: 14px;
    }

    /* Blockquotes */
    .expo-content blockquote,
    .ProseMirror blockquote {
      border-left: 4px solid #06B6D4;
      padding-left: 16px;
      margin: 16px 0;
      background-color: #f0f9ff;
      padding: 12px 16px;
      border-radius: 8px;
      font-style: italic;
    }

    body.dark-mode .expo-content blockquote,
    body.dark-mode .ProseMirror blockquote {
      background-color: #334155;
      border-left-color: #06B6D4;
    }

    /* Links */
    .expo-content a,
    .ProseMirror a {
      color: #06B6D4;
      text-decoration: none;
      cursor: pointer;
    }

    .expo-content a:hover,
    .ProseMirror a:hover {
      text-decoration: underline;
    }

    body.dark-mode .expo-content a,
    body.dark-mode .ProseMirror a {
      color: #22d3ee;
    }

    /* Text formatting */
    .expo-content strong,
    .ProseMirror strong {
      font-weight: 700;
    }

    .expo-content em,
    .ProseMirror em {
      font-style: italic;
    }

    .expo-content u,
    .ProseMirror u {
      text-decoration: underline;
    }

    .expo-content s,
    .ProseMirror s {
      text-decoration: line-through;
    }

    /* Images */
    .expo-content img,
    .ProseMirror img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 16px 0;
      display: block;
    }

    /* Tables */
    .expo-content table,
    .ProseMirror table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      overflow-x: auto;
      display: block;
    }

    .expo-content th,
    .expo-content td,
    .ProseMirror th,
    .ProseMirror td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }

    body.dark-mode .expo-content th,
    body.dark-mode .expo-content td,
    body.dark-mode .ProseMirror th,
    body.dark-mode .ProseMirror td {
      border-color: #334155;
    }

    .expo-content th,
    .ProseMirror th {
      background-color: #f3f4f6;
      font-weight: 600;
    }

    body.dark-mode .expo-content th,
    body.dark-mode .ProseMirror th {
      background-color: #1e293b;
    }

    /* Horizontal rule */
    .expo-content hr,
    .ProseMirror hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 24px 0;
    }

    body.dark-mode .expo-content hr,
    body.dark-mode .ProseMirror hr {
      border-top-color: #334155;
    }

    /* Math (KaTeX) */
    .katex {
      font-size: 1.1em;
    }

    body.dark-mode .katex {
      color: #f5f5f4;
    }

    /* Text alignment */
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-justify { text-align: justify; }

    /* Highlight */
    mark {
      background-color: #fef08a;
      color: inherit;
      padding: 2px 4px;
      border-radius: 2px;
    }

    body.dark-mode mark {
      background-color: #854d0e;
    }

    /* KaTeX inline math */
    .katex { font-size: 1.1em; }
    .katex-display { margin: 1em 0; text-align: center; }
    body.dark-mode .katex { color: #f5f5f4; }
  </style>
</head>
<body>
  <div class="expo-content">
    <div class="ProseMirror">
      ${htmlContent}
    </div>
  </div>

  <script>
    // Listen for theme changes from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
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

    // Also listen for postMessage (React Native)
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('ready');
    }
  </script>
</body>
</html>`;
}
