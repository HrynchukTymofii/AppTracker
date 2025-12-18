"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BarChart2, BookOpen, GraduationCap, Home, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { LoginModal } from "./login-modal"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useAuth } from "@/lib/useAuth"

export function Navbar() {
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get("embed") === "true"
  const {user} = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  const isLoggedIn = !!user

  // Hide navbar if embedded
  if (isEmbedded) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background px-8 rounded-b-3xl">
      <div className="flex flex-row h-16 items-center justify-between">
        {/* Logo */}
        <div className="mr-4 flex items-center md:mr-6">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">SAT Tutor</span>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
                onClick={() => setIsOpen(false)}
                >
                <Home className="h-5 w-5" />
                Home
              </Link>

              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">Online SAT</h3>
                <Link
                  href="/test"
                  className="ml-4 flex items-center gap-2 rounded-md p-2 hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Full Practice Test
                </Link>
                <Link
                  href="/test"
                  className="ml-4 flex items-center gap-2 rounded-md p-2 hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Math Section
                </Link>
                <Link
                  href="/test"
                  className="ml-4 flex items-center gap-2 rounded-md p-2 hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Reading & Writing Section
                </Link>
              </div>

              <Link
                href="/course"
                className="flex items-center gap-2 text-lg font-semibold"
                onClick={() => setIsOpen(false)}
                >
                <BookOpen className="h-5 w-5" />
                Course
              </Link>

              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">SAT Info</h3>
                <Link
                  href="/info/what-is-sat"
                  className="ml-4 flex items-center gap-2 rounded-md p-2 hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  What is SAT?
                </Link>
                <Link
                  href="/info/how-sat-is-scored"
                  className="ml-4 flex items-center gap-2 rounded-md p-2 hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  How SAT is Scored
                </Link>
                <Link
                  href="/info/test-dates-registration"
                  className="ml-4 flex items-center gap-2 rounded-md p-2 hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Test Dates & Registration
                </Link>
              </div>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Button variant="outline" onClick={() => signOut()}>Logout</Button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link href="/" >
                    Home</Link></NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Online SAT</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {testItems.map((item) => (
                      <ListItem key={item.title} title={item.title} href={item.href}>
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild><Link href="/course" >Course</Link></NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>SAT Info</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {satInfoItems.map((item) => (
                      <ListItem key={item.title} title={item.title} href={item.href}>
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Auth Button */}
        <div className="ml-auto flex items-center gap-2">
          {isLoggedIn ? (
            <>
            {user.isPro &&
             <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white"
            >
              <BarChart2 className="w-4 h-4" />
              Dashboard
            </Link>}
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <Avatar className="h-6 w-6 ">
                  <AvatarImage src={user?.image || ''} />
                  <AvatarFallback className="bg-green-500">{(user?.name?.charAt(0) || 'U')}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {user?.name?.split(' ')[0] || 'Користувач'}
                </span>
              </Link>
            </>
          ) : (
            <LoginModal>
              <Button variant="secondary" className="cursor-pointer">Login</Button>
            </LoginModal>
          )}
        </div>
      </div>
    </header>
  );
}

const testItems = [
  {
    title: "Full Practice Test",
    href: "/test",
    description: "Complete SAT practice tests with timed sections and scoring.",
  },
  {
    title: "Math Section",
    href: "/test/math-section",
    description: "Practice tests focused on the math section of the SAT.",
  },
  {
    title: "Reading & Writing Section",
    href: "/test/readwrite-section",
    description: "Practice tests for the reading and writing sections.",
  },
]

const satInfoItems = [
  {
    title: "What is SAT?",
    href: "/info/what-is-sat",
    description: "Learn about the SAT test structure and purpose.",
  },
  {
    title: "How SAT is Scored",
    href: "/info/how-sat-is-scored",
    description: "Understand the SAT scoring system and what your score means.",
  },
  {
    title: "Test Dates & Registration",
    href: "/info/test-dates-registration",
    description: "Find upcoming test dates and registration information.",
  },
]

interface ListItemProps extends React.ComponentPropsWithoutRef<"div"> {
  title: string
  children: React.ReactNode
  href: string
}

export function ListItem({ className, title, href, children }: ListItemProps) {
  return (
      <NavigationMenuLink asChild>
        <Link
            href={href}
            className={cn(
                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                className,
            )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </Link>
      </NavigationMenuLink>
  )
}

const navigationMenuTriggerStyle = () => {
  return cn(
    "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
  )
}
