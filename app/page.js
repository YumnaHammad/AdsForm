'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    initiated_by: '',
    product: '',
    agent_name: '',
    team_brand: '',
    ab_testing: '',
    budget: '',
    approved_by_bi: '',
    approved_by_digital: '',
    approved_by_operations: '',
    phone_number: '',
    approved_by_madam: '',
  });

  const [fieldUpdatedBy, setFieldUpdatedBy] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isUserTypingRef = useRef(false);
  const formDataRef = useRef(formData);
  const pendingFieldsRef = useRef(new Set());
  const inputRefs = useRef({});
  const savedFieldsRef = useRef(new Set()); // Track which fields are saved in DB

  const fields = [
    { key: 'initiated_by', label: 'Initiated By' },
    { key: 'product', label: 'Product' },
    { key: 'agent_name', label: 'Agent Name' },
    { key: 'team_brand', label: 'Team / Brand' },
    { key: 'ab_testing', label: 'AB Testing' },
    { key: 'budget', label: 'Budget' },
    { key: 'approved_by_bi', label: 'Approved By BI' },
    { key: 'approved_by_digital', label: 'Approved By Digital' },
    { key: 'approved_by_operations', label: 'Approved By Operations' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'approved_by_madam', label: 'Approved By Madam' },
  ];

  // Initialize current user
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(storedUser);
    } else {
      const newUser = `User_${Math.random().toString(36).substring(2, 11)}`;
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', newUser);
    }
  }, []);

  // Fetch form data
  const fetchFormData = async () => {
    if (isUserTypingRef.current) {
      console.log('[FORM] Skipping fetch - user is typing');
      return;
    }
    try {
      console.log('[FORM] Fetching data from MongoDB via /api/form...');
      const response = await fetch('/api/form', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      console.log('[FORM] API Response from MongoDB:', result);
      
      if (result.success && result.data) {
        const data = result.data;
        console.log('[FORM] MongoDB Data Received:', {
          _id: data._id,
          initiated_by: data.initiated_by,
          product: data.product,
          is_complete: data.is_complete,
        });
        const incomingData = {
          initiated_by: data.initiated_by || '',
          product: data.product || '',
          agent_name: data.agent_name || '',
          team_brand: data.team_brand || '',
          ab_testing: data.ab_testing || '',
          budget: data.budget || '',
          approved_by_bi: data.approved_by_bi || '',
          approved_by_digital: data.approved_by_digital || '',
          approved_by_operations: data.approved_by_operations || '',
          phone_number: data.phone_number || '',
          approved_by_madam: data.approved_by_madam || '',
        };

        const pendingFields = pendingFieldsRef.current;
        const savedFields = savedFieldsRef.current;
        const mergedData = { ...incomingData };
        
        // Preserve local unsaved changes (fields that are pending or not yet saved)
        fields.forEach((field) => {
          const fieldKey = field.key;
          const localValue = formDataRef.current?.[fieldKey] || '';
          const dbValue = mergedData[fieldKey] || '';
          
          // If field is pending (being edited) OR not saved yet, keep local value
          // This ensures unsaved changes are never overwritten by polling
          if (pendingFields.has(fieldKey) || !savedFields.has(fieldKey)) {
            if (localValue.trim() !== '') {
              mergedData[fieldKey] = localValue;
              console.log('[FORM] Preserving unsaved local change for:', fieldKey, localValue);
            }
          }
        });

        const isSameData = fields.every(field => {
          const key = field.key;
          const currentValue = (formDataRef.current?.[key] || '').trim();
          const incomingValue = (mergedData[key] || '').trim();
          return currentValue === incomingValue;
        });

        if (!isSameData) {
          setFormData(mergedData);
        }

        // Track who updated each field
        const updatedByMap = {};
        if (data.field_updates && Array.isArray(data.field_updates)) {
          data.field_updates.forEach((update) => {
            if (update.field_name && update.updated_by) {
              updatedByMap[update.field_name] = update.updated_by;
            }
          });
        }
        console.log('[FORM] Field updates from MongoDB:', updatedByMap);
        setFieldUpdatedBy(updatedByMap);

        // Check locally if all fields are filled
        const allFieldsFilled = fields.every(field => {
          const fieldValue = data[field.key];
          return fieldValue && fieldValue.trim() !== '';
        });
        
        const isFormComplete = allFieldsFilled || result.isComplete || false;
        console.log('[FORM] Form completion status:', isFormComplete);
        setIsComplete(isFormComplete);
        
        // Calculate missing fields
        const missing = fields.filter(field => !data[field.key] || data[field.key].trim() === '');
        setMissingFields(missing.map(f => f.label));
        
        console.log('[FORM] Missing fields:', missing.map(f => f.label));
        setLoading(false);
        console.log('[FORM] Data fetch completed successfully');
      } else {
        console.warn('[FORM] API response not successful:', result);
        setLoading(false);
      }
    } catch (error) {
      console.error('[FORM] Error fetching form data from MongoDB:', error);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFormData().then(() => {
      // Mark all existing fields as saved after initial fetch
      fields.forEach(field => {
        if (formData[field.key] && formData[field.key].trim() !== '') {
          savedFieldsRef.current.add(field.key);
        }
      });
    });
  }, []);

  // Poll for updates every 2 seconds (only updates fields that are saved in DB)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only fetch if user is not actively typing
      if (!isUserTypingRef.current) {
        fetchFormData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Keep latest formData in ref for comparison
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Check if form is complete whenever formData changes
  useEffect(() => {
    const fieldStatus = fields.map(field => {
      const fieldValue = formData[field.key];
      const isFilled = fieldValue && fieldValue.trim() !== '';
      return { key: field.key, label: field.label, value: fieldValue, isFilled };
    });
    
    const allFieldsFilled = fieldStatus.every(f => f.isFilled);
    
    console.log('[FORM] Form completion check:', {
      allFieldsFilled,
      fieldStatus,
      isCompleteState: isComplete,
    });
    
    setIsComplete(allFieldsFilled);
    
    // Update missing fields
    const missing = fieldStatus.filter(f => !f.isFilled);
    setMissingFields(missing.map(f => f.label));
    
    if (missing.length > 0) {
      console.log('[FORM] Missing fields preventing submission:', missing.map(f => `${f.label} (${f.key}): "${f.value}"`));
    } else {
      console.log('[FORM] ✅ All fields filled! Submit button should be enabled.');
    }
  }, [formData]);

  // Validate budget (numbers only)
  const validateBudget = (value) => {
    if (!value) return { valid: false, message: '' };
    
    // Allow only numbers, commas, and dots
    const cleaned = value.replace(/[^\d.,]/g, '');
    
    if (value !== cleaned) {
      return {
        valid: false,
        message: 'Budget must contain only numbers'
      };
    }
    
    return { valid: true, message: '' };
  };

  // Handle field change (only local state, no database save)
  const handleFieldChange = (fieldName, value) => {
    console.log('[FORM] Field change detected (local only, NOT saved to DB):', { fieldName, value });
 
    // Validate budget
    if (fieldName === 'budget') {
      const validation = validateBudget(value);
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: validation.message
      }));
      
      if (!validation.valid && value.trim() !== '') {
        console.warn('[FORM] Budget validation failed:', validation.message);
        // Don't update if invalid
        return;
      }
    }

    // Mark field as not saved (remove from saved set if it was there)
    savedFieldsRef.current.delete(fieldName);
    
    // Mark field as pending (being edited)
    pendingFieldsRef.current.add(fieldName);

    // Update UI immediately for responsive typing
    const updatedData = { ...formData, [fieldName]: value };
    console.log('[FORM] Updating local state only (NOT in database):', { fieldName, value });
    setFormData(updatedData);
 
    const allFieldsFilled = fields.every(field => {
      const fieldValue = updatedData[field.key];
      const isFilled = fieldValue && fieldValue.trim() !== '';
      return isFilled;
    });
    
    console.log('[FORM] Field change - completion check:', {
      allFieldsFilled,
      fieldName,
      value,
    });
    
    setIsComplete(allFieldsFilled);

    const missing = fields.filter(field => {
      const fieldValue = updatedData[field.key];
      return !fieldValue || fieldValue.trim() === '';
    });
    setMissingFields(missing.map(f => f.label));
  };

  // Handle save field to database (when + icon is clicked)
  const handleSaveField = async (fieldName, value) => {
    if (!currentUser) {
      console.warn('[FORM] No current user, skipping field save');
      setStatusMessage({
        type: 'error',
        text: 'Please wait for user initialization.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    // Validate budget before saving
    if (fieldName === 'budget') {
      const validation = validateBudget(value);
      if (!validation.valid && value.trim() !== '') {
        setFieldErrors(prev => ({
          ...prev,
          [fieldName]: validation.message
        }));
        setStatusMessage({
          type: 'error',
          text: 'Please enter a valid budget before saving.',
        });
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }
    }

    try {
      console.log('[FORM] Saving field to MongoDB:', { fieldName, value, updatedBy: currentUser });
      const response = await fetch('/api/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          fieldName,
          value,
          updatedBy: currentUser,
        }),
      });
      const result = await response.json();
      console.log('[FORM] MongoDB save response:', result);
      
      if (result.success) {
        console.log('[FORM] Successfully saved to MongoDB:', { fieldName, value });
        
        // Mark field as saved in database
        savedFieldsRef.current.add(fieldName);
        
        setFieldUpdatedBy((prev) => ({
          ...prev,
          [fieldName]: currentUser,
        }));
        
        // Show success message briefly
        setStatusMessage({
          type: 'success',
          text: `${fields.find(f => f.key === fieldName)?.label} saved successfully!`,
        });
        setTimeout(() => setStatusMessage(null), 2000);

        // Auto-focus next field
        const currentIndex = fields.findIndex(f => f.key === fieldName);
        if (currentIndex < fields.length - 1) {
          const nextField = fields[currentIndex + 1];
          const nextInput = inputRefs.current[nextField.key];
          if (nextInput) {
            setTimeout(() => {
              nextInput.focus();
            }, 100);
          }
        }
      } else {
        console.error('[FORM] MongoDB save failed:', result);
        setStatusMessage({
          type: 'error',
          text: 'Failed to save field. Please try again.',
        });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (error) {
      console.error('[FORM] Error saving field to MongoDB:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to save field. Please try again.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[FORM] Form submission started');

    // Validate budget
    const budgetValidation = validateBudget(formData.budget);
    if (!budgetValidation.valid) {
      setFieldErrors(prev => ({
        ...prev,
        budget: budgetValidation.message
      }));
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid budget amount before submitting.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    // Check if all fields are filled, if not, focus on first empty field
    const emptyFields = fields.filter(field => {
      const fieldValue = formData[field.key];
      return !fieldValue || fieldValue.trim() === '';
    });

    if (emptyFields.length > 0) {
      // Find first empty field and focus on it
      const firstEmptyField = emptyFields[0];
      const emptyInput = inputRefs.current[firstEmptyField.key];
      
      if (emptyInput) {
        emptyInput.focus();
        emptyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setStatusMessage({
        type: 'error',
        text: `Please fill all fields. Starting with: ${firstEmptyField.label}`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    try {
      console.log('[FORM] Submitting form to MongoDB...');
      const response = await fetch('/api/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit',
        }),
      });

      const result = await response.json();
      console.log('[FORM] Submit response from MongoDB:', result);
      
      if (result.success) {
        console.log('[FORM] Form submitted successfully to MongoDB');
        
        // Show success message
        setStatusMessage({
          type: 'success',
          text: '✅ Form submitted successfully! Record has been added to the table. Redirecting to records...',
        });
        
        // Clear all fields immediately after successful submission
        const emptyFormData = {
          initiated_by: '',
          product: '',
          agent_name: '',
          team_brand: '',
          ab_testing: '',
          budget: '',
          approved_by_bi: '',
          approved_by_digital: '',
          approved_by_operations: '',
          phone_number: '',
          approved_by_madam: '',
        };
        
        console.log('[FORM] Clearing all form fields...');
        setFormData(emptyFormData);
        formDataRef.current = emptyFormData;
        setFieldUpdatedBy({});
        setIsComplete(false);
        setFieldErrors({});
        pendingFieldsRef.current.clear();
        savedFieldsRef.current.clear();
        
        // Clear the form in database
        try {
          await fetch('/api/form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'clear',
            }),
          });
          console.log('[FORM] Form cleared in database');
        } catch (error) {
          console.error('[FORM] Error clearing form in database:', error);
        }
        
        // Redirect to records page after showing success message
        setTimeout(() => {
          router.push('/records');
        }, 2500);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'Failed to submit form.',
        });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to submit form. Please try again.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Handle clear form
  const handleClearForm = async () => {
    setFormData({
      initiated_by: '',
      product: '',
      agent_name: '',
      team_brand: '',
      ab_testing: '',
      budget: '',
      approved_by_bi: '',
      approved_by_digital: '',
      approved_by_operations: '',
      phone_number: '',
      approved_by_madam: '',
    });
    setFieldUpdatedBy({});
    setIsComplete(false);
    setFieldErrors({});
    setStatusMessage(null);
    pendingFieldsRef.current.clear();
    formDataRef.current = {
      initiated_by: '',
      product: '',
      agent_name: '',
      team_brand: '',
      ab_testing: '',
      budget: '',
      approved_by_bi: '',
      approved_by_digital: '',
      approved_by_operations: '',
      phone_number: '',
      approved_by_madam: '',
    };

    try {
      await fetch('/api/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear',
        }),
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to clear form. Please try again.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading form...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-header">
        <h1 className="form-title">ADD REQUEST APPROVAL</h1>
        <div style={{ marginTop: '20px' }}>
          <Link href="/records" className="submit-button" style={{ fontSize: '15px', padding: '12px 28px', width: 'auto', maxWidth: '100%' }}>
             View All Records
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className={`status-message status-${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-fields-grid">
          {fields.map((field) => (
            <div key={field.key} className="form-field">
              <label className="form-label">
                {field.label}
                <span className="required">*</span>
              </label>
              <div className="input-with-save">
                <input
                  ref={(el) => (inputRefs.current[field.key] = el)}
                  type={field.key === 'budget' ? 'number' : field.key === 'phone_number' ? 'tel' : 'text'}
                  className={`form-input ${fieldErrors[field.key] ? 'form-input-error' : ''}`}
                  value={formData[field.key]}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // For budget, only allow numbers
                    if (field.key === 'budget') {
                      value = value.replace(/[^\d]/g, '');
                    }
                    
                    // For phone number, allow only 11 digits
                    if (field.key === 'phone_number') {
                      value = value.replace(/[^\d]/g, ''); // Remove all non-digits
                      if (value.length > 11) {
                        value = value.slice(0, 11); // Limit to 11 digits
                      }
                    }
                    
                    handleFieldChange(field.key, value);
                  }}
                  onKeyDown={(e) => {
                    // Allow Tab key to move to next field
                    if (e.key === 'Tab') {
                      // Default behavior is fine
                    }
                    // Allow Enter key to save and move to next
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveField(field.key, formData[field.key]);
                    }
                  }}
                  placeholder={
                    field.key === 'budget' 
                      ? 'Enter amount (numbers only)' 
                      : field.key === 'phone_number'
                      ? 'Enter 11 digits'
                      : 'Type your answer here...'
                  }
                  maxLength={field.key === 'phone_number' ? 11 : undefined}
                  min={field.key === 'budget' ? '0' : undefined}
                  step={field.key === 'budget' ? '1' : undefined}
                  style={{ paddingRight: '50px' }}
                />
                <button
                  type="button"
                  className="save-field-button"
                  onClick={() => handleSaveField(field.key, formData[field.key])}
                  title="Save and move to next field"
                >
                  +
                </button>
              </div>
              {fieldErrors[field.key] && (
                <div className="field-error">
                  {fieldErrors[field.key]}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
          >
            ✅ Submit Form
          </button>
          <button
            type="button"
            className="clear-form"
            onClick={handleClearForm}
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}

