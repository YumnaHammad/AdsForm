import connectDB from "./mongodb";
import FormEntry from "@/models/FormEntry";

// Get or create current active entry
export async function getCurrentEntry() {
  console.log("[DB] getCurrentEntry - Connecting to MongoDB...");
  await connectDB();
  console.log("[DB] MongoDB connected, querying for incomplete entry...");

  let entry = await FormEntry.findOne({ is_complete: false })
    .sort({ createdAt: -1 })
    .lean();

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

// Submit and clear form
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

// Get all submitted records
export async function getAllSubmittedRecords() {
  console.log("[DB] getAllSubmittedRecords - Connecting to MongoDB...");
  await connectDB();

  console.log("[DB] Querying for all completed records (is_complete: true)...");
  const allRecords = await FormEntry.find();
  console.log("[DB] Found records from MongoDB:", allRecords.length);

  // Filter out blank records (records with all fields empty)
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

  const nonBlankRecords = allRecords.filter((record) => {
    // Check if at least one field has a value
    return requiredFields.some((field) => {
      const value = record[field];
      return value && value.toString().trim() !== "";
    });
  });

  console.log("[DB] Filtered blank records:", {
    total: allRecords.length,
    nonBlank: nonBlankRecords.length,
    removed: allRecords.length - nonBlankRecords.length,
  });
  console.log(
    "[DB] Record IDs:",
    nonBlankRecords.map((r) => r._id)
  );

  return nonBlankRecords;
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
