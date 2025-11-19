'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
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
      return;
    }
    try {
      const response = await fetch('/api/form');
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
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
        const mergedData = { ...incomingData };
        pendingFields.forEach((pendingField) => {
          if (mergedData.hasOwnProperty(pendingField)) {
            mergedData[pendingField] = formDataRef.current?.[pendingField] || '';
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
        setFieldUpdatedBy(updatedByMap);

        // Check locally if all fields are filled
        const allFieldsFilled = fields.every(field => {
          const fieldValue = data[field.key];
          return fieldValue && fieldValue.trim() !== '';
        });
        
        setIsComplete(allFieldsFilled || result.isComplete || false);
        
        // Calculate missing fields
        const missing = fields.filter(field => !data[field.key] || data[field.key].trim() === '');
        setMissingFields(missing.map(f => f.label));
        
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFormData();
  }, []);

  // Poll for updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFormData();
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
    const allFieldsFilled = fields.every(field => {
      const fieldValue = formData[field.key];
      return fieldValue && fieldValue.trim() !== '';
    });
    setIsComplete(allFieldsFilled);
    
    // Update missing fields
    const missing = fields.filter(field => {
      const fieldValue = formData[field.key];
      return !fieldValue || fieldValue.trim() === '';
    });
    setMissingFields(missing.map(f => f.label));
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

  // Handle field update
  const handleFieldChange = async (fieldName, value) => {
    if (!currentUser) return;
 
    // Validate budget
    if (fieldName === 'budget') {
      const validation = validateBudget(value);
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: validation.message
      }));
      
      if (!validation.valid && value.trim() !== '') {
        // Don't update if invalid
        return;
      }
    }
 
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsUserTyping(true);
    isUserTypingRef.current = true;
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      isUserTypingRef.current = false;
    }, 1200);

    pendingFieldsRef.current.add(fieldName);

    // Update UI immediately for responsive typing
    const updatedData = { ...formData, [fieldName]: value };
    setFormData(updatedData);
    setFieldUpdatedBy((prev) => ({
      ...prev,
      [fieldName]: currentUser,
    }));
 
    const allFieldsFilled = fields.every(field => {
      const fieldValue = updatedData[field.key];
      return fieldValue && fieldValue.trim() !== '';
    });
    setIsComplete(allFieldsFilled);
 
    const missing = fields.filter(field => {
      const fieldValue = updatedData[field.key];
      return !fieldValue || fieldValue.trim() === '';
    });
    setMissingFields(missing.map(f => f.label));
 
    try {
      await fetch('/api/form', {
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
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to update field. Please try again.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      pendingFieldsRef.current.delete(fieldName);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (!isComplete) {
      setStatusMessage({
        type: 'error',
        text: 'Please fill all fields before submitting.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    try {
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
      
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: result.message || 'Form submitted successfully!',
        });
        
        // Reset form after submission
        setTimeout(() => {
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
          setStatusMessage(null);
          setFieldErrors({});
          fetchFormData();
        }, 1500);
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
              <input
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
              />
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
            disabled={!isComplete}
          >
            {isComplete ? '✅ Submit Form' : '⏳ Fill All Fields to Submit'}
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

