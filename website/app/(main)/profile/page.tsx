import { auth } from "@/lib/getAuth";
import { redirect } from "next/navigation";
import UserProfilePage from "./_components/user-profile";


export default async function Page() {
  const user = await auth()

  if(!user){
    redirect('/')
  }

  return (
    <UserProfilePage />
  )
}
