import connectDB from './mongodb';
import FormEntry from '@/models/FormEntry';

// Get or create current active entry
export async function getCurrentEntry() {
  await connectDB();
  
  let entry = await FormEntry.findOne({ is_complete: false })
    .sort({ createdAt: -1 })
    .lean();

  if (!entry) {
    entry = await FormEntry.create({});
    return entry.toObject();
  }

  return entry;
}

// Update a specific field
export async function updateField(fieldName, value, updatedBy) {
  await connectDB();
  
  const entry = await getCurrentEntry();
  
  const updateData = {
    [fieldName]: value || '',
    $push: {
      field_updates: {
        field_name: fieldName,
        field_value: value || '',
        updated_by: updatedBy,
        updated_at: new Date(),
      },
    },
  };

  const updatedEntry = await FormEntry.findByIdAndUpdate(
    entry._id,
    updateData,
    { new: true }
  ).lean();

  return updatedEntry;
}

// Check if all fields are filled
export function checkIfComplete(entry) {
  const requiredFields = [
    'initiated_by',
    'product',
    'agent_name',
    'team_brand',
    'ab_testing',
    'budget',
    'approved_by_bi',
    'approved_by_digital',
    'approved_by_operations',
    'phone_number',
    'approved_by_madam',
  ];

  return requiredFields.every(field => entry[field] && entry[field].trim() !== '');
}

// Submit and clear form
export async function submitForm() {
  await connectDB();
  
  const entry = await getCurrentEntry();
  
  if (checkIfComplete(entry)) {
    // Mark as complete
    await FormEntry.findByIdAndUpdate(entry._id, { is_complete: true });
    
    return { success: true, message: 'Form submitted successfully' };
  }
  
  return { success: false, message: 'All fields must be filled before submission' };
}

// Get all submitted records
export async function getAllSubmittedRecords() {
  await connectDB();
  
  const records = await FormEntry.find({ is_complete: true })
    .sort({ updatedAt: -1 })
    .lean();
  
  return records;
}

// Update a submitted record
export async function updateRecord(recordId, updateData) {
  await connectDB();
  
  const updatedRecord = await FormEntry.findByIdAndUpdate(
    recordId,
    updateData,
    { new: true }
  ).lean();
  
  return updatedRecord;
}

// Delete a submitted record
export async function deleteRecord(recordId) {
  await connectDB();
  
  const deletedRecord = await FormEntry.findByIdAndDelete(recordId).lean();
  
  return deletedRecord;
}

