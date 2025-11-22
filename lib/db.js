import connectDB from "./mongodb";
import FormEntry from "@/models/FormEntry";

// Get or create current active entry
export async function getCurrentEntry() {
  console.log("[DB] getCurrentEntry - Connecting to MongoDB...");
  await connectDB();
  console.log("[DB] MongoDB connected, querying for incomplete entry...");

  // First try to find an incomplete entry
  let entry = await FormEntry.findOne({ is_complete: { $ne: true } });

  if (!entry) {
    console.log("[DB] No incomplete entry found, creating new entry...");
    entry = await FormEntry.create({});
    console.log("[DB] New entry created:", { _id: entry._id });
    return entry.toObject();
  }

  console.log("[DB] Found existing entry:", {
    _id: entry._id,
    is_complete: entry.is_complete,
  });
  return entry;
}

// Update a specific field
export async function updateField(fieldName, value, updatedBy) {
  console.log("[DB] updateField - Connecting to MongoDB...");
  await connectDB();

  console.log("[DB] Getting current entry...");
  const entry = await getCurrentEntry();
  console.log("[DB] Current entry ID:", entry._id);

  const updateData = {
    [fieldName]: value || "",
    $push: {
      field_updates: {
        field_name: fieldName,
        field_value: value || "",
        updated_by: updatedBy,
        updated_at: new Date(),
      },
    },
  };

  console.log("[DB] Updating MongoDB document:", {
    entryId: entry._id,
    fieldName,
    value,
    updatedBy,
  });
  const updatedEntry = await FormEntry.findByIdAndUpdate(
    entry._id,
    updateData,
    { new: true }
  ).lean();

  console.log("[DB] MongoDB document updated successfully:", {
    _id: updatedEntry._id,
    [fieldName]: updatedEntry[fieldName],
  });

  return updatedEntry;
}

// Check if all fields are filled
export function checkIfComplete(entry) {
  const requiredFields = [
    "initiated_by",
    "product",
    "agent_name",
    "team_brand",
    "ab_testing",
    "budget",
    "approved_by_bi",
    "approved_by_digital",
    "approved_by_operations",
    "phone_number",
    "approved_by_madam",
  ];

  return requiredFields.every(
    (field) => entry[field] && entry[field].trim() !== ""
  );
}

// Reset the current entry to empty values
export async function resetCurrentEntry() {
  await connectDB();

  const entry = await getCurrentEntry();

  const resetFields = {
    initiated_by: "",
    product: "",
    agent_name: "",
    team_brand: "",
    ab_testing: "",
    budget: "",
    approved_by_bi: "",
    approved_by_digital: "",
    approved_by_operations: "",
    phone_number: "",
    approved_by_madam: "",
    field_updates: [],
    is_complete: false,
  };

  const updatedEntry = await FormEntry.findByIdAndUpdate(
    entry._id,
    resetFields,
    { new: true }
  ).lean();

  return updatedEntry;
}

// Submit and clear form - OLD VERSION (keep for backward compatibility)
export async function submitForm() {
  console.log("[DB] submitForm - Connecting to MongoDB...");
  await connectDB();

  console.log("[DB] Getting current entry to submit...");
  const entry = await getCurrentEntry();
  console.log("[DB] Current entry to submit:", {
    _id: entry._id,
    is_complete: entry.is_complete,
  });

  if (checkIfComplete(entry)) {
    console.log("[DB] Entry is complete, marking as submitted in MongoDB...");
    // Mark as complete
    await FormEntry.findByIdAndUpdate(entry._id, { is_complete: true });
    console.log("[DB] Entry marked as complete in MongoDB:", entry._id);

    return { success: true, message: "Form submitted successfully" };
  }

  console.warn("[DB] Entry is not complete, cannot submit");
  return {
    success: false,
    message: "All fields must be filled before submission",
  };
}

// NEW: Complete form and create new entry
export async function completeForm() {
  console.log("[DB] completeForm - Starting form completion process...");
  await connectDB();

  try {
    // Get current incomplete entry
    console.log("[DB] Finding current incomplete entry...");
    const currentEntry = await FormEntry.findOne({
      is_complete: { $ne: true },
    });

    if (!currentEntry) {
      console.log("[DB] No incomplete entry found, creating new one");
      const newEntry = await FormEntry.create({});
      return {
        success: true,
        data: newEntry.toObject(),
        completedEntry: null,
        message: "No form to complete, created new empty form",
      };
    }

    console.log("[DB] Current entry found:", {
      _id: currentEntry._id,
      is_complete: currentEntry.is_complete,
    });

    // Check if all fields are filled
    const isComplete = checkIfComplete(currentEntry);
    if (!isComplete) {
      console.warn("[DB] Form is not complete, cannot mark as complete");
      return {
        success: false,
        message: "All fields must be filled before completion",
      };
    }

    // Mark current entry as complete
    console.log("[DB] Marking current entry as complete...");
    const completedEntry = await FormEntry.findByIdAndUpdate(
      currentEntry._id,
      {
        is_complete: true,
        completed_at: new Date(),
      },
      { new: true }
    ).lean();

    console.log("[DB] Entry marked as complete:", {
      _id: completedEntry._id,
      is_complete: completedEntry.is_complete,
    });

    // Create a new empty entry for the next form
    console.log("[DB] Creating new empty entry...");
    const newEntry = await FormEntry.create({
      initiated_by: "",
      product: "",
      agent_name: "",
      team_brand: "",
      ab_testing: "",
      budget: "",
      approved_by_bi: "",
      approved_by_digital: "",
      approved_by_operations: "",
      phone_number: "",
      approved_by_madam: "",
      field_updates: [],
      is_complete: false,
      created_at: new Date(),
    });

    console.log("[DB] New empty entry created:", {
      _id: newEntry._id,
      is_complete: newEntry.is_complete,
    });

    return {
      success: true,
      data: newEntry.toObject(),
      completedEntry: completedEntry,
      message: "Form completed successfully and new form created",
    };
  } catch (error) {
    console.error("[DB] Error in completeForm:", error);
    throw error;
  }
}

// Get all submitted records
export async function getAllSubmittedRecords() {
  await connectDB();

  const allRecords = await FormEntry.find({ is_complete: true });

  return allRecords;
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
