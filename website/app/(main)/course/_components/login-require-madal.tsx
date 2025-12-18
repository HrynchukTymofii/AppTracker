"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { LoginModal } from "@/components/login-modal"

interface LoginFirstModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LoginFirstModal = ({ isOpen, onClose }: LoginFirstModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center space-y-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-purple-700">
            🚨 Woo woo woo! Hold up! 🚨
          </DialogTitle>
        </DialogHeader>

        <p className="text-base text-gray-700 leading-relaxed">
          Before you dive into SAT greatness, <span className="text-indigo-600 font-semibold">log in or sign up</span> to track your score, crush your goals, and flex on your future.
          <br />
          It’s <span className="font-bold text-green-600">100% free</span> — no excuses 🧠🔥
        </p>

        <LoginModal>
          <Button className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:brightness-110 text-white text-sm font-semibold shadow-md">
            <LogIn className="h-4 w-4 mr-2" />
            Let’s gooo 🚀
          </Button>
        </LoginModal>
      </DialogContent>
    </Dialog>
  )
}
