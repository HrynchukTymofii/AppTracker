"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function getUserData(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: {
        userId: userId,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        image: true,
        isPro: true,
        league: true,
        points: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return { success: true, user }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return { success: false, error: "Failed to fetch user data" }
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    email?: string
    image?: string
  },
) {
  try {
    const updatedUser = await db.user.update({
      where: {
        userId: userId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/dashboard")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function updateCategories(
  userId: string,
  categories: string
) {
  try {
    const updatedUser = await db.user.update({
      where: {
        userId: userId,
      },
      data: {
        league: categories,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/dashboard")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating categories:", error)
    return { success: false, error: "Не вдалося оновити категорії" }
  }
}


export async function upgradeToPro(userId: string) {
  try {
    const updatedUser = await db.user.update({
      where: {
        userId: userId,
      },
      data: {
        isPro: true,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/dashboard")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error upgrading to pro:", error)
    return { success: false, error: "Failed to upgrade to pro" }
  }
}

export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const updatedUser = await db.user.update({
      where: { userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    // Optional: revalidate any path that might depend on user data
    revalidatePath("/dashboard")

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, error: "Failed to update password" }
  }
}


export async function updateUserPoints(userId: string, points: number, platform: 'web' | 'mobile' = 'web') {
  try {
    const updatedUser = await db.user.update({
      where: {
        userId: userId,
      },
      data: {
        points: {
          increment: points,
        },
        updatedAt: new Date(),
        needSync: platform === 'web'
      },
    })

    revalidatePath("/dashboard")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating user points:", error)
    return { success: false, error: "Failed to update points" }
  }
}

export async function updateUserNeedSync(userId: string) {
  try {
    const updatedUser = await db.user.update({
      where: {
        userId: userId,
      },
      data: {
        updatedAt: new Date(),
        needSync: true
      },
    })
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating user points:", error)
    return { success: false, error: "Failed to update points" }
  }
}


export async function enrollUser(userId: string, courseId: string) {
  try {
    const existing = await db.courseSubscription.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      return { success: false, message: "User already enrolled" };
    }

    const userSubscription = await db.courseSubscription.create({
      data: {
        userId,
        courseId,
      },
    });

    revalidatePath("/course")

    return { success: true, data: userSubscription }
  } catch (error) {
    console.error("Enrollment failed:", error)
    return { success: false, error: (error as Error).message }
  }
}


export async function deleteUserAccount(userId: string) {
  try {
    await db.userQuizQuestion.deleteMany({ where: { userId } })
    await db.quizResult.deleteMany({ where: { userId } })
    await db.lessonProgress.deleteMany({ where: { userId } })
    //await db.courseEditor.deleteMany({ where: { userId } })

    await db.user.delete({ where: { userId } })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("❌ Error deleting user:", error)
    return { success: false, error: "Failed to delete user data" }
  }
}