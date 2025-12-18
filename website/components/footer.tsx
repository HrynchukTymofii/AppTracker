import { Target } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">SAT Prep Pro</span>
            </div>
            <p className="text-slate-400">
              Helping students achieve their dream SAT scores with personalized preparation and expert guidance.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Platform</h4>
            <div className="space-y-2">
              <Link href="/tests" className="block text-slate-400 hover:text-white transition-colors">
                Practice Tests
              </Link>
              <Link href="/course" className="block text-slate-400 hover:text-white transition-colors">
                Course
              </Link>
              <Link href="/info" className="block text-slate-400 hover:text-white transition-colors">
                SAT Info
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <div className="space-y-2">
              <Link href="/help" className="block text-slate-400 hover:text-white transition-colors">
                Help Center
              </Link>
              <Link href="/contact" className="block text-slate-400 hover:text-white transition-colors">
                Contact Us
              </Link>
              <Link href="/faq" className="block text-slate-400 hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal</h4>
            <div className="space-y-2">
              <Link href="/privacy" className="block text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund" className="block text-slate-400 hover:text-white transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-400">© {new Date().getFullYear()} SAT Prep Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
