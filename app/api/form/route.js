import { NextResponse } from 'next/server';
import { getCurrentEntry, updateField, submitForm, checkIfComplete, resetCurrentEntry } from '@/lib/db';

// GET - Get current form data
export async function GET() {
  try {
    console.log('[API] GET /api/form - Fetching from MongoDB...');
    const entry = await getCurrentEntry();
    console.log('[API] MongoDB entry fetched:', {
      _id: entry._id,
      is_complete: entry.is_complete,
      initiated_by: entry.initiated_by,
      product: entry.product,
    });
    return NextResponse.json(
      { success: true, data: entry },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[API] Error fetching form data from MongoDB:', error);
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
    console.log('[API] POST /api/form - Action:', action, { fieldName, value, updatedBy });

    if (action === 'update') {
      if (!fieldName || !updatedBy) {
        console.error('[API] Missing required fields:', { fieldName, updatedBy });
        return NextResponse.json(
          { success: false, error: 'Field name and updated by are required' },
          { status: 400 }
        );
      }

      console.log('[API] Updating field in MongoDB:', { fieldName, value, updatedBy });
      const entry = await updateField(fieldName, value || '', updatedBy);
      const isComplete = checkIfComplete(entry);
      console.log('[API] Field updated in MongoDB:', {
        _id: entry._id,
        fieldName,
        newValue: entry[fieldName],
        isComplete,
      });

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

    if (action === 'clear') {
      const entry = await resetCurrentEntry();
      return NextResponse.json({ success: true, data: entry });
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

