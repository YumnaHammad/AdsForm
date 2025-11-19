import mongoose from 'mongoose';

const FormEntrySchema = new mongoose.Schema({
  initiated_by: {
    type: String,
    default: '',
  },
  product: {
    type: String,
    default: '',
  },
  agent_name: {
    type: String,
    default: '',
  },
  team_brand: {
    type: String,
    default: '',
  },
  ab_testing: {
    type: String,
    default: '',
  },
  budget: {
    type: String,
    default: '',
  },
  approved_by_bi: {
    type: String,
    default: '',
  },
  approved_by_digital: {
    type: String,
    default: '',
  },
  approved_by_operations: {
    type: String,
    default: '',
  },
  phone_number: {
    type: String,
    default: '',
  },
  approved_by_madam: {
    type: String,
    default: '',
  },
  is_complete: {
    type: Boolean,
    default: false,
  },
  field_updates: [{
    field_name: String,
    field_value: String,
    updated_by: String,
    updated_at: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

const FormEntry = mongoose.models.FormEntry || mongoose.model('FormEntry', FormEntrySchema);

export default FormEntry;

