import { NextResponse } from 'next/server';
import { addToWaitlist, markEmailSent } from '@/lib/db';
import { sendWaitlistEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, deviceOS, dailyScreenTime } = body;

    // Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!deviceOS || !Array.isArray(deviceOS) || deviceOS.length === 0) {
      return NextResponse.json(
        { error: 'At least one device OS is required' },
        { status: 400 }
      );
    }

    if (!dailyScreenTime || typeof dailyScreenTime !== 'string') {
      return NextResponse.json(
        { error: 'Daily screen time is required' },
        { status: 400 }
      );
    }

    // Add to database
    const { id, isNew } = await addToWaitlist({
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      deviceOS,
      dailyScreenTime,
    });

    // Send confirmation email (only for new signups)
    if (isNew) {
      try {
        await sendWaitlistEmail(email, name);
        await markEmailSent(id);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: isNew
        ? 'Successfully joined the waitlist!'
        : 'Your information has been updated!',
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    );
  }
}
