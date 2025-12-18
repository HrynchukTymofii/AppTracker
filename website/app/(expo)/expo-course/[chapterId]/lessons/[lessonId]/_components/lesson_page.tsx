"use client"

import LessonYouTubeVideo from "@/components/lightYouTubeVideo";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { Lesson } from "@prisma/client";
import { ReadOnlyEditor } from "@/components/tiptap-templates/simple/readonly-editor";
import { useState } from "react";
import { Loader } from "@/components/loader";

interface LessonProps {
    lesson: Lesson;
}

const LessonContent = ({ lesson }: LessonProps) => {

    return (
        <div className="expo-content flex flex-col gap-y-8 py-2 lg:w-[768px] w-full mx-auto flex-1 bg-[#f8fafc] dark:bg-[#0f172a]">
            {lesson.content && (
                <ReadOnlyEditor initialContent={lesson.content} />
            )}
        </div>
    );
};

export default LessonContent;
