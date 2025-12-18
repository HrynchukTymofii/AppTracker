"use client"

//import { SignInButton, useAuth } from "@clerk/nextjs";
//import { PiShootingStarFill} from "react-icons/pi";
//import axios from "axios";
//import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
//import { db } from "@/lib/db";

interface CourseEnrolBlockProps{
    courseId: string;
}

const CourseEnrolBlock = ({/*{courseId} : CourseEnrolBlockProps*/}) => {
    //const { userId } = useAuth();

    //const router = useRouter();

    //const firstChapterId = ""

    // const onEnrol = async () => {
    //   try {
    //     await axios.post(`/api/user/subscription`, {userId, courseId});
    //     toast.success("Course updated");
    //     router.push(`/courses/${courseId}/chapters/${firstChapterId}`)
    // } catch {
    //     toast.error("Something went wrong");
    // }
    // }
    return (
        <div >
            {/* {!userId ? (
            <SignInButton >
                <div className="flex flex-row w-full items-center justify-center bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-700 border-slate-300 text-slate-200 font-semibold text-lg border rounded-lg gap-x-2 p-4 mt-12">                 
                    Enrol in course <PiShootingStarFill className=" w-5 h-5"/>
                </div>
            </SignInButton>
            ): (
            <div className="flex flex-row w-full items-center justify-center bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-700 border-slate-300 text-slate-200 font-semibold text-lg border rounded-lg gap-x-2 p-4 mt-12 cursor-pointer" onClick={onEnrol}> Enrol in course <PiShootingStarFill className=" w-5 h-5"/></div>
            )} */}
        </div>
    )
}

export default CourseEnrolBlock
