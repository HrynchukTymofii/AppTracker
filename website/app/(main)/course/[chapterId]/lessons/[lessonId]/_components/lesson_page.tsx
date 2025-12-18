"use client"

import LessonYouTubeVideo from "@/components/lightYouTubeVideo";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { GrFormNextLink } from "react-icons/gr";
import axios from "axios";
import { Lesson, MuxData } from "@prisma/client";
import { ReadOnlyEditor } from "@/components/tiptap-templates/simple/readonly-editor";
import { useState } from "react";
import { Loader } from "@/components/loader";
import { useAuth } from "@/lib/useAuth";
interface LessonProps {
    lesson: Lesson;
    lessonId: string;
    chapterId: string;
    courseId: string;
}

const LessonContent = ({ lesson, lessonId, chapterId, courseId }: LessonProps) => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const user = useAuth()
    const userId = user.userId

    if(!userId) return

    const handleNextLesson = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/user/course/lesson', {
                userId,
                lessonId,
            });

            if (response.status === 200) {
                const { data: nextItem } = await axios.post("/api/user/course/next-page", {
                    userId,
                    courseId,
                    currentChapterId: chapterId,
                    currentItemId: lessonId
                });

                if (nextItem) {
                    const url = nextItem.type === "lesson"
                        ? `/course/${nextItem.chapterId}/lessons/${nextItem.id}`
                        : `/course/${nextItem.chapterId}/quizzes/${nextItem.id}`;
                    router.push(url);
                    router.refresh();
                } else {
                    toast.success("You have completed all lessons in this chapter!");
                    router.push(`/course`);
                }
            } else {
                toast.error("Failed to update progress.");
            }
        } catch (error) {
            console.error("Error in handleNextLesson:", error);
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-[400px] flex justify-center items-center">
                <Loader text="Preparing a new lesson" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-8 my-12 mx-2 lg:w-[768px] w-full">
            <div className="flex flex-col gap-y-2">
                <h1 className="text-4xl font-semibold">{lesson.title}</h1>
            </div>

            {lesson.youTubeVideoUrl ? (
                <div className="relative w-full rounded-lg overflow-hidden border-2 border-slate-600">
                    <LessonYouTubeVideo youTubeVideoUrl={lesson.youTubeVideoUrl} />
                </div>
            ) : lesson.videoUrl ? (
                <div className="h-96 relative aspect-video rounded-lg overflow-hidden border-2 border-slate-600" />
            ) : null}

            <div>
                {lesson.content && (
                    <ReadOnlyEditor initialContent={lesson.content} />
                )}
            </div>

            <div className="w-full flex items-center justify-end">
                <Button onClick={handleNextLesson}>
                    Done! Go to next <GrFormNextLink className="ml-3 w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default LessonContent;
