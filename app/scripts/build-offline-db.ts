import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import axios from "axios";
import pLimit from "p-limit";
import { fetchRenderedLessonHtml } from "./render-lesson-html";
//npx ts-node scripts/build-offline-db.ts

// TipTap to HTML converter for quiz content (question, explanation, hint)
function tiptapToHtml(content: any): string {
  if (!content) return "";

  // If it's already a string, return it
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return convertTiptapNodes(parsed);
    } catch {
      return content; // Return as-is if not JSON
    }
  }

  return convertTiptapNodes(content);
}

function convertTiptapNodes(content: any): string {
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
    "$": "&#36;", 
  };
  return text.replace(/[&<>"'$]/g, (m) => map[m]);
}


const API_BASE_URL = "https://www.satlearner.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

const OUTPUT_DIR = path.join(__dirname, "../offline-build");
const DB_FILE = path.join(OUTPUT_DIR, "satprep.db");
const IMAGES_DIR = path.join(OUTPUT_DIR, "images");

const IMAGE_CONCURRENT_DOWNLOADS = 10;
const MAX_CONCURRENT_QUIZ_REQUESTS = 5;
const limitImages = pLimit(IMAGE_CONCURRENT_DOWNLOADS);
const limitQuizzes = pLimit(MAX_CONCURRENT_QUIZ_REQUESTS);

async function downloadImage(url: string, id: string) {
  try {
    const extMatch = url.match(/\.(png|jpg|jpeg|gif)$/i);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const filename = `${id}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);

    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filepath, res.data);

    return filename;
  } catch (err) {
    console.warn("⚠️ Failed to download image", id, url);
    return null;
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const db = new sqlite3.Database(DB_FILE);
  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    // Chapters
    db.run(`CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      videoUrl TEXT,
      youTubeVideoUrl TEXT,
      position INTEGER,
      isPublished INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0
    )`);

    // Lessons
    db.run(`CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      renderedHtml TEXT,
      videoUrl TEXT,
      youTubeVideoUrl TEXT,
      description TEXT,
      position INTEGER,
      isPublished INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      points INTEGER DEFAULT 10,
      chapterId TEXT NOT NULL,
      FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE
    )`);

    // Lesson sections
    db.run(`CREATE TABLE IF NOT EXISTS lesson_sections (
      id TEXT PRIMARY KEY,
      text TEXT,
      position INTEGER,
      type TEXT DEFAULT 'Text',
      lines TEXT DEFAULT '1',
      lessonId TEXT NOT NULL,
      FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
    )`);

    // Quizzes
    db.run(`CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      totalQuestions INTEGER DEFAULT 0,
      position INTEGER,
      isPublished INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      maxScore INTEGER DEFAULT 0,
      chapterId TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE
    )`);

    // Quiz questions
    db.run(`CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      questionType TEXT,
      questionImageUrl TEXT,
      localImagePath TEXT,
      imageHeight INTEGER DEFAULT 200,
      options TEXT,
      answers TEXT,
      hint TEXT,
      points INTEGER DEFAULT 5,
      position INTEGER,
      hintImageUrl TEXT,
      localHintImagePath TEXT,
      note TEXT,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0,
      quizId TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    )`);

    // Lesson progress
    db.run(`CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      lessonId TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
    )`);

    // Quiz results
    db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      answers TEXT,
      score INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      attemptCount INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    )`);

    // User quiz question interactions
    db.run(`CREATE TABLE IF NOT EXISTS user_quiz_questions (
      id TEXT PRIMARY KEY,
      questionId TEXT NOT NULL,
      liked INTEGER DEFAULT 0,
      disliked INTEGER DEFAULT 0,
      saved INTEGER DEFAULT 0,
      FOREIGN KEY (questionId) REFERENCES quiz_questions(id) ON DELETE CASCADE
    )`);
  });

  // 2️⃣ Fetch chapters
  const chaptersRes = await api.get("/user/course/chapters");
  const chapters = chaptersRes.data;
  const allQuestions: any[] = [];

  for (const c of chapters) {
    // Insert chapter first
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO chapters VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.title,
          c.description,
          c.videoUrl,
          c.youTubeVideoUrl,
          c.position,
          1,
          c.isFree ? 1 : 0,
        ],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Insert lessons & sections
    for (const l of c.lessons) {
      // Fetch and render lesson HTML
      console.log(`🎨 Rendering lesson: ${l.title} (${l.id})...`);
      const rendered = await fetchRenderedLessonHtml(c.id, l.id, l.content);
      const renderedHtml = rendered?.combinedHtml || null;

      if (rendered) {
        console.log(`✅ Successfully rendered HTML for ${l.title}`);
      } else {
        console.warn(`⚠️ Failed to render HTML for ${l.title}, will use WebView fallback`);
      }

      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO lessons VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            l.id,
            l.title,
            l.content,
            renderedHtml,
            l.videoUrl,
            l.youTubeVideoUrl,
            l.description,
            l.position,
            1,
            l.isFree ? 1 : 0,
            l.points,
            c.id,
          ],
          (err) => (err ? reject(err) : resolve())
        );
      });

      for (const s of l.sections || []) {
        await new Promise<void>((resolve, reject) => {
          db.run(
            `INSERT OR REPLACE INTO lesson_sections VALUES (?, ?, ?, ?, ?, ?)`,
            [s.id, s.text, s.position, s.type || "Text", s.lines || "1", l.id],
            (err) => (err ? reject(err) : resolve())
          );
        });
      }
    }

    // Insert quizzes & fetch questions
    for (const q of c.quizzes) {
      // Fetch quiz questions first
      const quizRes = await api.get(`/user/course/quiz/${q.id}/questions`);
      const questions = quizRes.data;

      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO quizzes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            q.id,
            q.title,
            q.description,
            q.totalQuestions,
            q.position,
            1,
            q.isFree ? 1 : 0,
            q.maxScore,
            c.id,
            q.updatedAt,
          ],
          (err) => (err ? reject(err) : resolve())
        );
      });

      // Add quiz questions to the pool
      questions.forEach((qq: any) =>
        allQuestions.push({ ...qq, quizId: q.id })
      );
    }
  }

  // 3️⃣ Download images for all questions (both question images and hint images)
  const withLocalImages = await Promise.all(
    allQuestions.map((qq) =>
      limitImages(async () => {
        let localPath = null;
        let localHintPath = null;

        // Download question image
        if (qq.questionImageUrl) {
          localPath = await downloadImage(qq.questionImageUrl, qq.id);
        }

        // Download hint image
        if (qq.hintImageUrl) {
          localHintPath = await downloadImage(qq.hintImageUrl, `${qq.id}_hint`);
        }

        return {
          ...qq,
          localImagePath: localPath,
          localHintImagePath: localHintPath,
          // hintImageUrl stays as original URL (already in qq.hintImageUrl)
        };
      })
    )
  );

  // 4️⃣ Convert TipTap to HTML and insert quiz questions
  console.log("🔄 Converting TipTap content to HTML...");
  const withHtmlContent = withLocalImages.map((qq) => {
    const questionHtml = tiptapToHtml(qq.question);
    const hintHtml = qq.hint ? tiptapToHtml(qq.hint) : "";
    const noteHtml = qq.note ? tiptapToHtml(qq.note) : "";

    return {
      ...qq,
      questionHtml,
      hintHtml,
      noteHtml,
    };
  });

  db.serialize(() => {
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO quiz_questions
     (id, question, questionType, questionImageUrl, localImagePath, imageHeight, options, answers, hint, points, position, hintImageUrl, localHintImagePath, note, likes, dislikes, quizId, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const qq of withHtmlContent) {
      stmt.run(
        qq.id,
        qq.questionHtml, // Convert question to HTML
        qq.questionType || "",
        qq.questionImageUrl || "",
        qq.localImagePath || "",
        qq.imageHeight || 200,
        JSON.stringify(qq.options || []),
        JSON.stringify(qq.answers || []),
        qq.hintHtml, // Convert hint to HTML
        qq.points || 1,
        qq.position || 0,
        qq.hintImageUrl || "", // Original hint image URL from API
        qq.localHintImagePath || "", // Local hint image filename
        qq.noteHtml, // Convert note (explanation) to HTML
        qq.likes || 0,
        qq.dislikes || 0,
        qq.quizId,
        qq.updatedAt
      );
    }

    stmt.finalize();
  });

  console.log("✅ Converted all quiz content to HTML");

  db.close();
  console.log("✅ Offline DB built at:", DB_FILE);
  console.log("✅ Images saved at:", IMAGES_DIR);
}

main().catch((err) => console.error("❌ Failed:", err));
