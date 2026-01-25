import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitorId, lastScreen, totalTimeSeconds, completed, userId } = body;

    // Validation
    if (!visitorId || typeof visitorId !== 'string') {
      return NextResponse.json(
        { error: 'visitorId is required' },
        { status: 400 }
      );
    }

    if (!lastScreen || typeof lastScreen !== 'string') {
      return NextResponse.json(
        { error: 'lastScreen is required' },
        { status: 400 }
      );
    }

    if (typeof totalTimeSeconds !== 'number' || totalTimeSeconds < 0) {
      return NextResponse.json(
        { error: 'totalTimeSeconds must be a non-negative number' },
        { status: 400 }
      );
    }

    // Upsert: create if not exists, update if exists
    const result = await db.onboardingProgress.upsert({
      where: { visitorId },
      update: {
        lastScreen,
        totalTimeSeconds: Math.round(totalTimeSeconds),
        completed: completed ?? false,
        userId: userId ?? undefined,
        convertedAt: completed ? new Date() : undefined,
      },
      create: {
        visitorId,
        lastScreen,
        totalTimeSeconds: Math.round(totalTimeSeconds),
        completed: completed ?? false,
        userId: userId ?? null,
        convertedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      id: result.id,
    });
  } catch (error) {
    console.error('Onboarding progress error:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding progress' },
      { status: 500 }
    );
  }
}
