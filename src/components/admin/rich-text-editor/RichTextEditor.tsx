"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useState, useEffect } from "react";
import { ToolbarBtn, Separator, EmojiPicker } from "./toolbar-components";

/**
 * Lightweight rich text editor for admin content editing.
 * Built on tiptap — outputs HTML string via hidden input.
 * Features: Bold, Italic, Underline, Bullet List, Alignment, Emoji.
 */
export function RichTextEditor({
    name,
    defaultValue = "",
    placeholder = "Enter content…",
    className = "",
}: {
    name: string;
    defaultValue?: string;
    placeholder?: string;
    className?: string;
}) {
    const [html, setHtml] = useState(defaultValue);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                code: false,
                blockquote: false,
                horizontalRule: false,
            }),
            Underline,
            TextAlign.configure({ types: ["paragraph"] }),
        ],
        content: defaultValue || "",
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm max-w-none min-h-[120px] px-4 py-3 text-[14px] text-heading outline-none focus:outline-none",
            },
        },
        onUpdate: ({ editor: e }) => {
            setHtml(e.getHTML());
        },
    });

    // Sync content back if defaultValue changes externally
    useEffect(() => {
        if (editor && defaultValue && editor.getHTML() !== defaultValue) {
            editor.commands.setContent(defaultValue);
            setHtml(defaultValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultValue]);

    const insertEmoji = (emoji: string) => {
        if (editor) {
            editor.chain().focus().insertContent(emoji).run();
        }
    };

    return (
        <div className={`rounded-xl border border-[rgba(0,0,0,0.08)] bg-white overflow-hidden ${className}`}>
            {/* Toolbar */}
            {editor && (
                <div className="flex flex-wrap items-center gap-0.5 border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAF8] px-2 py-1.5">
                    <ToolbarBtn
                        active={editor.isActive("bold")}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Bold"
                    >
                        <span className="font-bold">B</span>
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={editor.isActive("italic")}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Italic"
                    >
                        <span className="italic">I</span>
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={editor.isActive("underline")}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        title="Underline"
                    >
                        <span className="underline">U</span>
                    </ToolbarBtn>

                    <Separator />

                    <ToolbarBtn
                        active={editor.isActive("bulletList")}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="2" cy="4" r="1.5" />
                            <circle cx="2" cy="8" r="1.5" />
                            <circle cx="2" cy="12" r="1.5" />
                            <rect x="5" y="3" width="10" height="2" rx="0.5" />
                            <rect x="5" y="7" width="10" height="2" rx="0.5" />
                            <rect x="5" y="11" width="10" height="2" rx="0.5" />
                        </svg>
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={editor.isActive("orderedList")}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="Ordered List"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <text x="0" y="5.5" fontSize="5" fontWeight="bold">1</text>
                            <text x="0" y="9.5" fontSize="5" fontWeight="bold">2</text>
                            <text x="0" y="13.5" fontSize="5" fontWeight="bold">3</text>
                            <rect x="5" y="3" width="10" height="2" rx="0.5" />
                            <rect x="5" y="7" width="10" height="2" rx="0.5" />
                            <rect x="5" y="11" width="10" height="2" rx="0.5" />
                        </svg>
                    </ToolbarBtn>

                    <Separator />

                    <ToolbarBtn
                        active={editor.isActive({ textAlign: "left" })}
                        onClick={() => editor.chain().focus().setTextAlign("left").run()}
                        title="Align Left"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="0" y="2" width="14" height="2" rx="0.5" />
                            <rect x="0" y="6" width="10" height="2" rx="0.5" />
                            <rect x="0" y="10" width="12" height="2" rx="0.5" />
                        </svg>
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={editor.isActive({ textAlign: "center" })}
                        onClick={() => editor.chain().focus().setTextAlign("center").run()}
                        title="Align Center"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="1" y="2" width="14" height="2" rx="0.5" />
                            <rect x="3" y="6" width="10" height="2" rx="0.5" />
                            <rect x="2" y="10" width="12" height="2" rx="0.5" />
                        </svg>
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={editor.isActive({ textAlign: "right" })}
                        onClick={() => editor.chain().focus().setTextAlign("right").run()}
                        title="Align Right"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="2" y="2" width="14" height="2" rx="0.5" />
                            <rect x="6" y="6" width="10" height="2" rx="0.5" />
                            <rect x="4" y="10" width="12" height="2" rx="0.5" />
                        </svg>
                    </ToolbarBtn>

                    <Separator />

                    <EmojiPicker onSelect={insertEmoji} />
                </div>
            )}

            {/* Editor area */}
            <EditorContent editor={editor} />

            {/* Hidden input to send HTML via form */}
            <input type="hidden" name={name} value={html} />
        </div>
    );
}
