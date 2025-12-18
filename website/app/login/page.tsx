import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, GraduationCap, Mail, Lock, Sparkles } from "lucide-react"
import Link from "next/link"
import { AuthProviders } from "@/components/auth-providers"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl" />

      <div className="max-w-md mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <Link href="/">
          <Button
            variant="outline"
            className="mb-6 flex items-center gap-2 border-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Header Card */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-3xl blur opacity-30" />
          <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white p-8">
              <div className="flex flex-col items-center text-center">
                {/* 3D Graduation Cap Icon */}
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl transform rotate-6" />
                  <div className="absolute inset-0 bg-white/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <GraduationCap className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                  Welcome Back
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </h1>
                <p className="text-cyan-100">Sign in to continue your SAT preparation journey</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Login Form Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-20 blur" />
          <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl">
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 text-center">Sign In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {/* Social Login */}
              <AuthProviders />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500 font-semibold">Or continue with email</span>
                </div>
              </div>

              {/* Email Form */}
              <form className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">
                    Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link href="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-700 underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-600 hover:via-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Sign In
                </Button>
              </form>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-cyan-600 hover:text-cyan-700 underline font-bold">
                  Sign up here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
