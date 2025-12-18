"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Mail, Lock } from "lucide-react"
import { AuthProviders } from "@/components/auth-providers"
import { signIn } from "next-auth/react"
import { registerUser } from "@/lib/registerUser"
import { useRouter } from "next/navigation"

interface LoginModalProps {
  children: React.ReactNode
}

export function LoginModal({ children }: LoginModalProps) {
  const [open, setOpen] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const router = useRouter()

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    try {
      await registerUser({
        name: `${firstName} ${lastName}`,
        email: regEmail,
        password,
      })

      const res = await signIn("credentials", {
        redirect: false,
        email: regEmail,
        password,
      });

      if (res?.ok) {
        router.push("/profile")
      } else {
        alert("Login failed after registration.");
      }

      setOpen(false)
    } catch (error) {
      console.error("Registration error:", error)
      alert("Failed to register. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle></DialogTitle>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
        <div className="relative">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg" />

          <div className="relative">
            <Card className="shadow-2xl border-0 bg-white">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-white/20 rounded-lg mb-4">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">Welcome to SAT Tutor</h2>
                  <p className="text-green-100 text-sm">Sign in or create an account to continue</p>
                </div>
              </div>

              <CardContent className="p-6">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>

                  {/* LOGIN TAB */}
                  <TabsContent value="login" className="space-y-4">
                    <AuthProviders />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><Separator /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500">Or continue with email</span>
                      </div>
                    </div>

                    <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault()
                      const email = (e.currentTarget.elements.namedItem("modal-email") as HTMLInputElement).value
                      const password = (e.currentTarget.elements.namedItem("modal-password") as HTMLInputElement).value

                      const res = await signIn("credentials", {
                        redirect: false,
                        email,
                        password,
                      })

                      if (res?.error) {
                        console.error(res.error)
                        alert("Login failed. Please check your credentials.")
                      } else {
                        setOpen(false)
                      }
                    }}>
                      <div className="space-y-2">
                        <Label htmlFor="modal-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input id="modal-email" type="email" placeholder="Enter your email" className="pl-10" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="modal-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input id="modal-password" type="password" placeholder="Enter your password" className="pl-10" required />
                        </div>
                      </div>

                      <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                        Sign In
                      </Button>
                    </form>
                    <div className="text-center">
                      <button type="button" className="text-sm text-blue-600 hover:text-blue-800 underline">
                        Forgot password?
                      </button>
                    </div>
                  </TabsContent>

                  {/* REGISTER TAB */}
                  <TabsContent value="register" className="space-y-4">
                    <AuthProviders isRegister />

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500">Or create account with email</span>
                      </div>
                    </div>

                    {/* ✅ Register Form with validation */}
                    <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="modal-firstName" className="text-slate-700">First Name</Label>
                          <Input id="modal-firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="modal-lastName" className="text-slate-700">Last Name</Label>
                          <Input id="modal-lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="modal-reg-email" className="text-slate-700">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input id="modal-reg-email" type="email" placeholder="Enter your email" className="pl-10" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="modal-reg-password" className="text-slate-700">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input id="modal-reg-password" type="password" placeholder="Create a password" className="pl-10" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="modal-confirm-password" className="text-slate-700">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input id="modal-confirm-password" type="password" placeholder="Confirm your password" className="pl-10" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                      </div>

                      <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
