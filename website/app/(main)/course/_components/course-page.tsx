"use client";

import {
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  CheckCircle,
  HelpCircle,
  Star,
  Award,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";
import { courseInfo } from "./course-page-data";
import ReviewsSection from "./reviews-section";
import LetsGoSection from "./letsgo-section";
import FaqSection from "./faq-section";
import StorySection from "./story-section";
import PromiseSection from "./promise-section";
import { LoginFirstModal } from "./login-require-madal";
import { enrollUser } from "@/app/actions/user-actions";

interface CoursePageProps {
  course: any;
  isEnrolled: boolean;
  userId: string | null;
}

const CoursePage = ({ course, isEnrolled, userId }: CoursePageProps) => {
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isEnrolled) {
    return null
  }

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleContentClick = (
    chapterId: string,
    contentId: string,
    contentType: string
  ) => {
    window.location.href = `/course/${chapterId}/${contentType}s/${contentId}`;
  };

  const handleEnroll = async () => {
    if (!userId || !course?.id) return;

    const result = await enrollUser(userId, course.id);

    if (result.success) {
      console.log("Enrolled!", result.data);
    } else {
      console.error(result.message || result.error);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-7xl relative">
      {/* Floating gradient orbs background */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-cyan-500/10 rounded-full blur-3xl -z-10" />

      <div className="mx-auto px-4 py-8 ">
        {/* Hero Section - Video/Image and Enrollment Side by Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video/Image Section - Left Side */}
            <div className="lg:col-span-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
                <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl">
                  <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                  <div className="relative">
                    {course.courseVideoUrl ? (
                      <div className="aspect-video">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${
                            course.courseVideoUrl.split("v=")[1]
                          }`}
                          title={course.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="aspect-video relative">
                        <Image
                          fill
                          className="object-cover"
                          alt={course.title}
                          src={
                            course.imageUrl ||
                            "/placeholder.svg?height=600&width=1200&query=course"
                          }
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Enrollment Card - Right Side */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-pink-600/30 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
                  <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-600" />
                    <CardContent className="p-6">
                      {/* Add course title here */}
                      <div className="mb-4">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                          {course.title}
                        </h1>
                        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/30">
                          {courseInfo.level}
                        </Badge>
                      </div>

                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
                        Free
                      </div>

                      {/* Course Stats */}
                      <div className="mb-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= 4
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted stroke-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-slate-600">
                            (128 reviews)
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-700">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                              <Users className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <span>{courseInfo.students} students</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100">
                              <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span>Updated {courseInfo.lastUpdated}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100">
                              <Clock className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <span>{courseInfo.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
                              <Award className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <span>Certificate</span>
                          </div>
                        </div>
                      </div>

                      {userId ? (
                        <Button
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 rounded-2xl py-6 text-base font-semibold"
                          onClick={() => handleEnroll()}
                        >
                          Enroll Now - It&apos;s Free
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 rounded-2xl py-6 text-base font-semibold"
                          onClick={() => setShowLoginModal(true)}
                        >
                          Enroll Now - It&apos;s Free
                        </Button>
                      )}
                      <LoginFirstModal
                        isOpen={showLoginModal}
                        onClose={() => setShowLoginModal(false)}
                      />

                      <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <span className="text-sm font-medium text-slate-700">Full lifetime access</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-slate-700">
                            Access on mobile and desktop
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50">
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-slate-700">
                            Certificate of completion
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Storytelling Section - Replace "Why This Course Rocks" */}
        <StorySection />

        {/* Course Content Section - Full Width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
            <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden py-6 mb-8">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 transform rotate-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  Course Content
                </CardTitle>
                <CardDescription className="text-base text-slate-600">
                  {course.chapters.length} chapters •{" "}
                  {course.chapters.reduce(
                    (acc: number, chapter: any) =>
                      acc + chapter.lessons.length + chapter.quizzes.length,
                    0
                  )}{" "}
                  lessons and quizzes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {course.chapters.map((chapter: any, chapterIndex: number) => (
                  <Collapsible
                    key={chapter.id}
                    open={openChapters.includes(chapter.id)}
                    onOpenChange={() => toggleChapter(chapter.id)}
                    className="transition-all duration-200 ease-in-out"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl border-2 border-slate-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-200">
                            {chapterIndex + 1}
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-slate-900">
                              {chapter.title}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {chapter.lessons.length} lessons •{" "}
                              {chapter.quizzes.length} quizzes
                            </p>
                          </div>
                        </div>
                        {openChapters.includes(chapter.id) ? (
                          <ChevronDown className="h-5 w-5 text-blue-600 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-200" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-2 animate-slide-down">
                      <div className="ml-11 space-y-2 border-l-2 border-gradient-to-b from-blue-300 to-purple-300 pl-4">
                        {/* Lessons */}
                        {chapter.lessons.map(
                          (lesson: any, lessonIndex: number) => {

                            return (
                              <motion.div
                                key={`lesson-${lesson.id}`}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: lessonIndex * 0.05,
                                }}
                                className="relative group cursor-pointer"
                                onClick={() =>
                                  handleContentClick(
                                    chapter.id,
                                    lesson.id,
                                    "lesson"
                                  )
                                }
                              >
                                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all hover:shadow-md border border-transparent hover:border-cyan-200">
                                  <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm">
                                    {lessonIndex + 1}
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100">
                                    <Play className="h-3.5 w-3.5 text-cyan-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-slate-700 group-hover:text-cyan-700 transition-colors">
                                      {lesson.title}
                                    </h5>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                        )}

                        {/* Quizzes */}
                        {chapter.quizzes.map((quiz: any, quizIndex: number) => {

                          return (
                            <motion.div
                              key={`quiz-${quiz.id}`}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.2,
                                delay:
                                  (chapter.lessons.length + quizIndex) * 0.05,
                              }}
                              className="relative group cursor-pointer"
                              onClick={() =>
                                handleContentClick(chapter.id, quiz.id, "quiz")
                              }
                            >
                              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all hover:shadow-md border border-transparent hover:border-amber-200">
                                <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-amber-100 to-orange-200 text-amber-700 rounded-lg text-xs font-bold shadow-sm">
                                  Q{quizIndex + 1}
                                </div>
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
                                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">
                                    {quiz.title}
                                  </h5>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Move "By the End You'll..." section here - after Course Content */}
        <PromiseSection />
      </div>

      <div>
        {/* Student Reviews Section - New Vertical Card Styles */}
        <ReviewsSection />

        {/* Let's Go CTA Section - Move here after reviews */}
        <LetsGoSection />

        {/* FAQ Section */}
        <FaqSection />
      </div>
    </div>
  );
};

export default CoursePage;
















// "use client";

// import {
//   File,
//   ChevronDown,
//   ChevronRight,
//   Play,
//   FileText,
//   Lock,
//   CheckCircle,
//   Circle,
//   HelpCircle,
//   Star,
//   Award,
//   Users,
//   Calendar,
//   Clock,
// } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { courseInfo } from "./course-page-data";
// import ReviewsSection from "./reviews-section";
// import LetsGoSection from "./letsgo-section";
// import FaqSection from "./faq-section";

// import StorySection from "./story-section";
// import PromiseSection from "./promise-section";
// import { LoginFirstModal } from "./login-require-madal";
// import { db } from "@/lib/db";
// import { enrollUser } from "@/app/actions/user-actions";
// import { useRouter } from "next/navigation";

// interface CoursePageProps {
//   course: any;
//   isEnrolled: boolean;
//   userId: string | null;
// }

// const CoursePage = ({ course, isEnrolled, userId }: CoursePageProps) => {
//   const [openChapters, setOpenChapters] = useState<string[]>([]);
//   const [showLoginModal, setShowLoginModal] = useState(false);

//   if (isEnrolled) {
//     return null
//   }

//   const toggleChapter = (chapterId: string) => {
//     setOpenChapters((prev) =>
//       prev.includes(chapterId)
//         ? prev.filter((id) => id !== chapterId)
//         : [...prev, chapterId]
//     );
//   };

//   const handleContentClick = (
//     chapterId: string,
//     contentId: string,
//     contentType: string
//   ) => {
//     // Navigate to content
//     window.location.href = `/course/${chapterId}/${contentType}s/${contentId}`;
//   };

//   const handleEnroll = async () => {
//     if (!userId || !course?.id) return;

//     const result = await enrollUser(userId, course.id);

//     if (result.success) {
//       console.log("Enrolled!", result.data);
//     } else {
//       console.error(result.message || result.error);
//     }
//   };

//   // Calculate course progress
//   const calculateProgress = () => {
//     let totalItems = 0;
//     let completedItems = 0;

//     course.chapters.forEach((chapter: any) => {
//       // Count lessons
//       chapter.lessons.forEach((lesson: any) => {
//         totalItems++;
//         if (
//           lesson.progress &&
//           lesson.progress.length > 0 &&
//           lesson.progress[0].isCompleted
//         ) {
//           completedItems++;
//         }
//       });

//       // Count quizzes
//       chapter.quizzes.forEach((quiz: any) => {
//         totalItems++;
//         if (
//           quiz.results &&
//           quiz.results.length > 0 &&
//           quiz.results[0].isPassed
//         ) {
//           completedItems++;
//         }
//       });
//     });

//     return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
//   };

//   const progress = calculateProgress();

//   return (
//     <div className="min-h-screen w-full max-w-7xl">
//       <div className="mx-auto px-4 py-8 ">
//         {/* Hero Section - Video/Image and Enrollment Side by Side */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="mb-8"
//         >
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Video/Image Section - Left Side */}
//             <div className="lg:col-span-2">
//               <Card className="overflow-hidden shadow-xl border-0 bg-white">
//                 <div className="relative">
//                   {course.courseVideoUrl ? (
//                     <div className="aspect-video">
//                       <iframe
//                         className="w-full h-full"
//                         src={`https://www.youtube.com/embed/${
//                           course.courseVideoUrl.split("v=")[1]
//                         }`}
//                         title={course.title}
//                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                         allowFullScreen
//                       ></iframe>
//                     </div>
//                   ) : (
//                     <div className="aspect-video relative">
//                       <Image
//                         fill
//                         className="object-cover"
//                         alt={course.title}
//                         src={
//                           course.imageUrl ||
//                           "/placeholder.svg?height=600&width=1200&query=course"
//                         }
//                       />
//                     </div>
//                   )}
//                 </div>
//               </Card>
//             </div>

//             {/* Enrollment Card - Right Side */}
//             <div className="space-y-6">
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5, delay: 0.4 }}
//               >
//                 <Card className="shadow-lg border-0 bg-white">
//                   <CardContent className="p-6">
//                     {/* Add course title here */}
//                     <div className="mb-4">
//                       <h1 className="text-2xl font-bold text-slate-900 mb-2">
//                         {course.title}
//                       </h1>
//                       <Badge
//                         variant="outline"
//                         className="bg-blue-50 text-blue-700 hover:bg-blue-50"
//                       >
//                         {courseInfo.level}
//                       </Badge>
//                     </div>

//                     <div className="text-3xl font-bold mb-4">Free</div>

//                     {/* Course Stats */}
//                     <div className="mb-6 space-y-3">
//                       <div className="flex items-center gap-2">
//                         <div className="flex items-center">
//                           {[1, 2, 3, 4, 5].map((star) => (
//                             <Star
//                               key={star}
//                               className={`h-4 w-4 ${
//                                 star <= 4
//                                   ? "fill-amber-400 text-amber-400"
//                                   : "fill-muted stroke-muted-foreground"
//                               }`}
//                             />
//                           ))}
//                         </div>
//                         <span className="text-sm text-muted-foreground">
//                           (128 reviews)
//                         </span>
//                       </div>

//                       <div className="space-y-2 text-sm">
//                         <div className="flex items-center gap-2">
//                           <Users className="h-4 w-4 text-muted-foreground" />
//                           <span>{courseInfo.students} students</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Calendar className="h-4 w-4 text-muted-foreground" />
//                           <span>Updated {courseInfo.lastUpdated}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Clock className="h-4 w-4 text-muted-foreground" />
//                           <span>{courseInfo.duration}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Award className="h-4 w-4 text-muted-foreground" />
//                           <span>Certificate</span>
//                         </div>
//                       </div>
//                     </div>

//                     {isEnrolled ? (
//                       <div className="space-y-4">
//                         <div className="space-y-2">
//                           <div className="flex justify-between items-center">
//                             <span className="text-sm font-medium">
//                               Your progress
//                             </span>
//                             <span className="text-sm font-medium">
//                               {progress}%
//                             </span>
//                           </div>
//                           <Progress value={progress} className="h-2" />
//                         </div>

//                         <Button
//                           className="w-full bg-green-600 hover:bg-green-700"
//                           onClick={() => {
//                             // Find first incomplete lesson/quiz
//                             let nextContent = null;

//                             for (const chapter of course.chapters) {
//                               // Check lessons
//                               for (const lesson of chapter.lessons) {
//                                 const isCompleted =
//                                   lesson.progress &&
//                                   lesson.progress.length > 0 &&
//                                   lesson.progress[0].isCompleted;
//                                 if (!isCompleted) {
//                                   nextContent = {
//                                     id: lesson.id,
//                                     type: "lesson",
//                                   };
//                                   break;
//                                 }
//                               }

//                               if (nextContent) break;

//                               // Check quizzes
//                               for (const quiz of chapter.quizzes) {
//                                 const isPassed =
//                                   quiz.results &&
//                                   quiz.results.length > 0 &&
//                                   quiz.results[0].isPassed;
//                                 if (!isPassed) {
//                                   nextContent = { id: quiz.id, type: "quiz" };
//                                   break;
//                                 }
//                               }

//                               if (nextContent) break;
//                             }

//                             if (nextContent) {
//                               window.location.href = `/courses/${course.id}/${nextContent.type}s/${nextContent.id}`;
//                             }
//                           }}
//                         >
//                           Continue Learning
//                         </Button>
//                       </div>
//                     ) : userId ? (
//                       <Button
//                         className="w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 transition-all duration-300"
//                         onClick={() => handleEnroll()}
//                       >
//                         Enroll Now - It&apos;s Free
//                       </Button>
//                     ) : (
//                       <Button
//                         className="w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 transition-all duration-300"
//                         onClick={() => setShowLoginModal(true)}
//                       >
//                         Enroll Now - It&apos;s Free
//                       </Button>
//                     )}
//                     <LoginFirstModal
//                       isOpen={showLoginModal}
//                       onClose={() => setShowLoginModal(false)}
//                     />

//                     <div className="mt-6 space-y-4">
//                       <div className="flex items-center gap-2">
//                         <CheckCircle className="h-5 w-5 text-green-500" />
//                         <span className="text-sm">Full lifetime access</span>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <CheckCircle className="h-5 w-5 text-green-500" />
//                         <span className="text-sm">
//                           Access on mobile and desktop
//                         </span>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <CheckCircle className="h-5 w-5 text-green-500" />
//                         <span className="text-sm">
//                           Certificate of completion
//                         </span>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Storytelling Section - Replace "Why This Course Rocks" */}
//         <StorySection />

//         {/* Course Content Section - Full Width */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.3 }}
//         >
//           <Card className="shadow-lg border-0 bg-white py-6 mb-8">
//             <CardHeader>
//               <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
//                 <FileText className="h-6 w-6" />
//                 Course Content
//               </CardTitle>
//               <CardDescription>
//                 {course.chapters.length} chapters •{" "}
//                 {course.chapters.reduce(
//                   (acc: number, chapter: any) =>
//                     acc + chapter.lessons.length + chapter.quizzes.length,
//                   0
//                 )}{" "}
//                 lessons and quizzes
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-2">
//               {course.chapters.map((chapter: any, chapterIndex: number) => (
//                 <Collapsible
//                   key={chapter.id}
//                   open={openChapters.includes(chapter.id)}
//                   onOpenChange={() => toggleChapter(chapter.id)}
//                   className="transition-all duration-200 ease-in-out"
//                 >
//                   <CollapsibleTrigger asChild>
//                     <Button
//                       variant="ghost"
//                       className="w-full justify-between p-4 h-auto hover:bg-slate-50 rounded-lg border border-slate-200 transition-all duration-200"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
//                           {chapterIndex + 1}
//                         </div>
//                         <div className="text-left">
//                           <h4 className="font-semibold text-slate-900">
//                             {chapter.title}
//                           </h4>
//                           <p className="text-sm text-slate-500">
//                             {chapter.lessons.length} lessons •{" "}
//                             {chapter.quizzes.length} quizzes
//                           </p>
//                         </div>
//                       </div>
//                       {openChapters.includes(chapter.id) ? (
//                         <ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-200" />
//                       ) : (
//                         <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-200" />
//                       )}
//                     </Button>
//                   </CollapsibleTrigger>
//                   <CollapsibleContent className="px-4 pb-2 animate-slide-down">
//                     <div className="ml-11 space-y-2 border-l-2 border-slate-100 pl-4">
//                       {/* Lessons */}
//                       {chapter.lessons.map(
//                         (lesson: any, lessonIndex: number) => {
//                           const isCompleted =
//                             lesson.progress &&
//                             lesson.progress.length > 0 &&
//                             lesson.progress[0].isCompleted;

//                           return (
//                             <motion.div
//                               key={`lesson-${lesson.id}`}
//                               initial={{ opacity: 0, x: -5 }}
//                               animate={{ opacity: 1, x: 0 }}
//                               transition={{
//                                 duration: 0.2,
//                                 delay: lessonIndex * 0.05,
//                               }}
//                               className="relative group cursor-pointer"
//                               onClick={() =>
//                                 handleContentClick(
//                                   chapter.id,
//                                   lesson.id,
//                                   "lesson"
//                                 )
//                               }
//                             >
//                               <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
//                                 <div className="flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-600 rounded-full text-xs">
//                                   {lessonIndex + 1}
//                                 </div>
//                                 <Play className="h-4 w-4 text-slate-400" />
//                                 <div className="flex-1">
//                                   <h5 className="font-medium text-slate-700 group-hover:text-slate-900">
//                                     {lesson.title}
//                                   </h5>
//                                 </div>
//                                 {isEnrolled ? (
//                                   isCompleted ? (
//                                     <CheckCircle className="h-4 w-4 text-green-500" />
//                                   ) : (
//                                     <Circle className="h-4 w-4 text-slate-300" />
//                                   )
//                                 ) : (
//                                   <Lock className="h-4 w-4 text-slate-400" />
//                                 )}
//                               </div>
//                             </motion.div>
//                           );
//                         }
//                       )}

//                       {/* Quizzes */}
//                       {chapter.quizzes.map((quiz: any, quizIndex: number) => {
//                         const isPassed =
//                           quiz.results &&
//                           quiz.results.length > 0 &&
//                           quiz.results[0].isPassed;

//                         return (
//                           <motion.div
//                             key={`quiz-${quiz.id}`}
//                             initial={{ opacity: 0, x: -5 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{
//                               duration: 0.2,
//                               delay:
//                                 (chapter.lessons.length + quizIndex) * 0.05,
//                             }}
//                             className="relative group cursor-pointer"
//                             onClick={() =>
//                               handleContentClick(chapter.id, quiz.id, "quiz")
//                             }
//                           >
//                             <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
//                               <div className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-full text-xs">
//                                 Q{quizIndex + 1}
//                               </div>
//                               <HelpCircle className="h-4 w-4 text-amber-400" />
//                               <div className="flex-1">
//                                 <h5 className="font-medium text-slate-700 group-hover:text-slate-900">
//                                   {quiz.title}
//                                 </h5>
//                               </div>
//                               {isEnrolled ? (
//                                 isPassed ? (
//                                   <Badge
//                                     variant="outline"
//                                     className="bg-green-50 text-green-700 hover:bg-green-50"
//                                   >
//                                     Passed
//                                   </Badge>
//                                 ) : (
//                                   <Badge
//                                     variant="outline"
//                                     className="bg-amber-50 text-amber-700 hover:bg-amber-50"
//                                   >
//                                     Not taken
//                                   </Badge>
//                                 )
//                               ) : (
//                                 <Lock className="h-4 w-4 text-slate-400" />
//                               )}
//                             </div>
//                           </motion.div>
//                         );
//                       })}
//                     </div>
//                   </CollapsibleContent>
//                 </Collapsible>
//               ))}
//             </CardContent>
//           </Card>
//         </motion.div>

//         {/* Move "By the End You'll..." section here - after Course Content */}
//         <PromiseSection />
//       </div>

//       <div>
//         {/* Student Reviews Section - New Vertical Card Styles */}
//         <ReviewsSection />

//         {/* Let's Go CTA Section - Move here after reviews */}
//         <LetsGoSection />

//         {/* FAQ Section */}
//         <FaqSection />
//       </div>
//     </div>
//   );
// };

// export default CoursePage;
