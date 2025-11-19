import { NextResponse } from 'next/server';
import { updateRecord, deleteRecord } from '@/lib/db';

// PUT - Update a record
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const updatedRecord = await updateRecord(id, body);
    
    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a record
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const deletedRecord = await deleteRecord(id);
    
    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}

