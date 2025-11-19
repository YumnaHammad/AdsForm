import { NextResponse } from 'next/server';
import { getCurrentEntry, updateField, submitForm, checkIfComplete } from '@/lib/db';

// GET - Get current form data
export async function GET() {
  try {
    const entry = await getCurrentEntry();
    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch form data' },
      { status: 500 }
    );
  }
}

// POST - Update a field or submit form
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, fieldName, value, updatedBy } = body;

    if (action === 'update') {
      if (!fieldName || !updatedBy) {
        return NextResponse.json(
          { success: false, error: 'Field name and updated by are required' },
          { status: 400 }
        );
      }

      const entry = await updateField(fieldName, value || '', updatedBy);
      const isComplete = checkIfComplete(entry);

      return NextResponse.json({
        success: true,
        data: entry,
        isComplete,
      });
    }

    if (action === 'submit') {
      const result = await submitForm();
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

