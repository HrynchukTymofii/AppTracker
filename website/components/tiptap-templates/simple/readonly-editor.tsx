"use client";

import * as React from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
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
import { TextStyleKit } from "@tiptap/extension-text-style";


// --- Custom Extensions ---
import { Link } from "@tiptap/extension-link";
import { Selection } from "@/components/tiptap-extension/selection-extension";
import { TrailingNode } from "@/components/tiptap-extension/trailing-node-extension";

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

interface ReadOnlyEditorProps {
  initialContent: string;
}

export function ReadOnlyEditor({ initialContent = "" }: ReadOnlyEditorProps) {
  const getInitialContent = () => {
    try {
      return JSON.parse(initialContent);
    } catch {
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: initialContent.replace(/<[^>]*>/g, ""), // Strip HTML tags
              },
            ],
          },
        ],
      };
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Lesson content area, start typing to enter text.",
        class: "focus:outline-none prose prose-lg dark:prose-invert max-w-none",
      },
    },
    extensions: [
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
      Selection,
      Mathematics.configure({
        katexOptions: {
          maxSize: 300,
        },
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      TrailingNode,
      Link.configure({ openOnClick: false }),
      TextStyleKit,
    ],
    content: getInitialContent(),
  });

  return (
    <div className={` relative`}>
      <EditorContext.Provider value={{ editor }}>
        <div className="content-wrapper overflow-hidden relative">
          <EditorContent
            editor={editor}
            role="presentation"
            className={`simple-editor-content transition-all duration-300`}
          />
        </div>
      </EditorContext.Provider>
    </div>
  );
}
