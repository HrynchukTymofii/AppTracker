'use server'

import { db } from "@/lib/db"
import { updateUserNeedSync } from "./user-actions"

export async function toggleSave(userId: string, questionId: string) {
  let saved: boolean

  const existing = await db.userQuizQuestion.findUnique({
    where: { userId_questionId: { userId, questionId } },
  })

  if (existing) {
    const updated = await db.userQuizQuestion.update({
      where: { userId_questionId: { userId, questionId } },
      data: { saved: !existing.saved },
    })
    saved = updated.saved
  } else {
    const created = await db.userQuizQuestion.create({
      data: { userId, questionId, saved: true },
    })
    saved = created.saved
  }

  await updateUserNeedSync(userId) 
  return saved
}