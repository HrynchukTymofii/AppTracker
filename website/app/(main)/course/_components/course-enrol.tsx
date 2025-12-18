"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PiShootingStarFill } from "react-icons/pi"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface CourseEnrolProps {
  courseId: string
}

const CourseEnrol = ({/*{ courseId }: CourseEnrolProps*/}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleEnrollment = async () => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would be an API call to enroll the user
      // await axios.post(`/api/user/subscription`, { userId, courseId });

      toast.success("You've successfully enrolled!")
      window.location.reload()
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleEnrollment}
      disabled={isLoading}
      className="w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 transition-all duration-300 h-12 text-lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Enrolling...
        </>
      ) : (
        <>
          Enroll in course <PiShootingStarFill className="ml-2 w-5 h-5" />
        </>
      )}
    </Button>
  )
}

export default CourseEnrol



/*"use client"

//import { SignInButton, useAuth } from "@clerk/nextjs";
import { PiShootingStarFill} from "react-icons/pi";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CourseEnrolProps{
    courseId: string;
}

const CourseEnrol = ({courseId} : CourseEnrolProps) => {
    //const { userId } = useAuth();

    // const router = useRouter();

    // const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    // const [nextChapterUrl, setNextChapterUrl] = useState<string | null>(null);
    // const [loading, setLoading] = useState<boolean>(true);

    // useEffect(() => {
    //     const fetchCourseStatus = async () => {
    //         if (userId){
    //             setLoading(true);
    //             try {
    //                 const { data: subscriptionData } = await axios.post("/api/user/is-subscribed", {
    //                     userId,
    //                     courseId,
    //                 });
    //                 setIsSubscribed(subscriptionData.isSubscribed);
              
    //                 const { data: nextItem } = await axios.post("/api/user/course/first-not-compleated-page", {
    //                     userId,
    //                     courseId,
    //                 });

    //                 if (nextItem) {
    //                     const url = nextItem.type === "lesson"
    //                       ? `/courses/${courseId}/chapters/${nextItem.chapterId}/lessons/${nextItem.id}`
    //                       : `/courses/${courseId}/chapters/${nextItem.chapterId}/quizzes/${nextItem.id}`;
    //                       setNextChapterUrl(url);
    //                 }
    //               } catch (error) {
    //                 console.error("Error fetching data:", error);
    //                 toast.error("Something went wrong");
    //               } finally {
    //                 setLoading(false);
    //               }
    //         } 
    //         setLoading(false);
    //     };
    
    //     fetchCourseStatus();
    // }, [userId, courseId]);

    // const onEnrol = async () => {
    //   try {
    //     await axios.post(`/api/user/subscription`, {userId, courseId});
    //     toast.success("You successfully enrolled!");
    //     if (nextChapterUrl) router.push(nextChapterUrl)
    // } catch {
    //     toast.error("Something went wrong");
    // }
    // }

    // const onContinueLearning = () => {
    //     try {
    //         if (nextChapterUrl) router.push(nextChapterUrl)
    //     } catch {
    //         toast.error("Something went wrong");
    //     }
    // }

   

    return (
        <div >
             {!userId ? (
            <SignInButton mode="modal">
                <div className="flex flex-row w-full items-center justify-center bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-700 border-slate-300 text-slate-200 font-semibold text-lg border rounded-lg gap-x-2 p-4 cursor-pointer">                 
                    Enrol in course <PiShootingStarFill className=" w-5 h-5"/>
                </div>
            </SignInButton>
            ): isSubscribed ? (
                <div className="flex flex-row w-full items-center justify-center bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-700 border-slate-300 text-slate-200 font-semibold text-lg border rounded-lg gap-x-2 p-4 cursor-pointer" onClick={onContinueLearning}> 
                    Continue learning <PiShootingStarFill className=" w-5 h-5"/>
                </div>
            ) : ( 
                <div className="flex flex-row w-full items-center justify-center bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-700 border-slate-300 text-slate-200 font-semibold text-lg border rounded-lg gap-x-2 p-4 cursor-pointer" > 
                    Enrol in course <PiShootingStarFill className=" w-5 h-5"/>
                </div>
             onClick={onEnrol})} 
        </div>
    )
}

export default CourseEnrol*/
