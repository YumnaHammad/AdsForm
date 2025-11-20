'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessLevel, setAccessLevel] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [allRecords, setAllRecords] = useState([]);

  const PASSWORDS = {
    viewer: 'Ads99',
    editor: 'Edit@01'
  };

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


  // Check if a record is blank (all fields empty)
  const isRecordBlank = (record) => {
    return fields.every(field => {
      const value = record[field.key];
      return !value || value.toString().trim() === '';
    });
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/records', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        const fetchedRecords = result.data || [];
        // Filter out blank records (records with all empty fields)
        const nonBlankRecords = fetchedRecords.filter(record => !isRecordBlank(record));
        console.log('[RECORDS] Filtered blank records:', {
          total: fetchedRecords.length,
          nonBlank: nonBlankRecords.length,
          removed: fetchedRecords.length - nonBlankRecords.length
        });
        setAllRecords(nonBlankRecords);
        setRecords(nonBlankRecords);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch records');
      }
    } catch (err) {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  // Always require password on mount - don't check sessionStorage
  useEffect(() => {
    // Clear any previous authentication
    sessionStorage.removeItem('recordsAuth');
    sessionStorage.removeItem('recordsAccessLevel');
    setIsAuthenticated(false);
    setAccessLevel(null);
    setLoading(false);
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password === PASSWORDS.viewer) {
      setIsAuthenticated(true);
      setAccessLevel('viewer');
      // Store in sessionStorage for current session only
      sessionStorage.setItem('recordsAuth', 'authenticated');
      sessionStorage.setItem('recordsAccessLevel', 'viewer');
      fetchRecords();
    } else if (password === PASSWORDS.editor) {
      setIsAuthenticated(true);
      setAccessLevel('editor');
      // Store in sessionStorage for current session only
      sessionStorage.setItem('recordsAuth', 'authenticated');
      sessionStorage.setItem('recordsAccessLevel', 'editor');
      fetchRecords();
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleEdit = (record) => {
    setEditingRecord(record._id);
    setEditFormData({ ...record });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (recordId) => {
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local records
        const updatedRecords = records.map(record => 
          record._id === recordId ? result.data : record
        );
        setRecords(updatedRecords);
        setEditingRecord(null);
        setEditFormData({});
        setError(null);
      } else {
        setError(result.error || 'Failed to update record');
      }
    } catch (err) {
      setError('Failed to update record. Please try again.');
    }
  };

  const handleEditFieldChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteClick = (recordId) => {
    setRecordToDelete(recordId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      const response = await fetch(`/api/records/${recordToDelete}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove from local records
        const updatedRecords = records.filter(record => record._id !== recordToDelete);
        setRecords(updatedRecords);
        setError(null);
        setShowDeleteModal(false);
        setRecordToDelete(null);
      } else {
        setError(result.error || 'Failed to delete record');
        setShowDeleteModal(false);
        setRecordToDelete(null);
      }
    } catch (err) {
      setError('Failed to delete record. Please try again.');
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  // Filter and sort records
  useEffect(() => {
    let filtered = [...allRecords];

    // Filter by product name
    if (searchProduct.trim() !== '') {
      filtered = filtered.filter(record =>
        record.product?.toLowerCase().includes(searchProduct.toLowerCase())
      );
    }

    // Filter by date
    if (filterDate !== '') {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.updatedAt);
        const filterDateObj = new Date(filterDate);
        return (
          recordDate.getFullYear() === filterDateObj.getFullYear() &&
          recordDate.getMonth() === filterDateObj.getMonth() &&
          recordDate.getDate() === filterDateObj.getDate()
        );
      });
    }

    // Sort records
    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      if (sortOrder === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    setRecords(filtered);
  }, [allRecords, searchProduct, filterDate, sortOrder]);

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="form-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#ff6b9d', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 107, 157, 0.1)', transition: 'all 0.3s ease' }}>
              ←
            </Link>
            <h1 className="form-title" style={{ margin: 0 }}>Access Records</h1>
          </div>
          <p style={{ color: '#666', marginTop: '10px', fontSize: '16px' }}>
            Please enter the password to view records
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '400px', margin: '40px auto' }}>
          <div className="form-field">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                style={{ 
                  padding: '12px 45px 12px 16px',
                  borderBottom: 'none',
                  borderBottomWidth: 0,
                  borderBottomStyle: 'none',
                  borderTop: '2px solid #ffe0e6',
                  borderLeft: '2px solid #ffe0e6',
                  borderRight: '2px solid #ffe0e6'
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ff6b9d',
                  fontSize: '18px',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {passwordError && (
              <div className="field-error" style={{ marginTop: '8px' }}>
                {passwordError}
              </div>
            )}
          </div>

          <div className="form-actions" >
            <button type="submit" className="submit-button">
              Access Records
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading records...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-header">
        <h1 className="form-title">Submitted Records</h1>
        <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
          Access Level: <strong style={{ color: accessLevel === 'editor' ? '#ff6b9d' : '#c44569' }}>
            {accessLevel === 'editor' ? 'Editor' : 'Viewer'}
          </strong>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="submit-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
            ← Back to Form
          </Link>
          <button
            onClick={fetchRecords}
            className="submit-button"
            style={{ fontSize: '15px', padding: '12px 28px' }}
            title="Refresh records"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '25px', 
        background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.02) 0%, rgba(255, 207, 239, 0.05) 100%)',
        borderRadius: '16px',
        border: '2px solid #ffe0e6'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          alignItems: 'end'
        }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>
              Search Product
            </label>
            <input
              type="text"
              className="form-input"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="Enter product name..."
              style={{ padding: '12px 16px' }}
            />
          </div>

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>
              Filter by Date
            </label>
            <input
              type="date"
              className="form-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ padding: '12px 16px' }}
            />
          </div>

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>
              Sort Order
            </label>
            <select
              className="form-input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ padding: '12px 16px', cursor: 'pointer' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {(searchProduct || filterDate) && (
            <button
              onClick={() => {
                setSearchProduct('');
                setFilterDate('');
              }}
              className="clear-form"
              style={{ 
                padding: '12px 20px',
                height: 'fit-content',
                alignSelf: 'end'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No submitted records yet. Submit a form to see records here.
        </div>
      ) : (
        <div className="table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>#</th>
                {fields.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th>Submitted At</th>
                {accessLevel === 'editor' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record._id}>
                  <td>{index + 1}</td>
                  {fields.map((field) => (
                    <td key={field.key}>
                      {editingRecord === record._id && accessLevel === 'editor' ? (
                        <input
                          type={field.key === 'budget' ? 'number' : field.key === 'phone_number' ? 'tel' : 'text'}
                          value={editFormData[field.key] || ''}
                          onChange={(e) => handleEditFieldChange(field.key, e.target.value)}
                          className="form-input"
                          style={{ 
                            padding: '6px 10px', 
                            fontSize: '13px', 
                            width: '100%',
                            minWidth: '100px'
                          }}
                        />
                      ) : (
                        record[field.key] || '-'
                      )}
                    </td>
                  ))}
                  <td>{formatDate(record.updatedAt)}</td>
                  {accessLevel === 'editor' && (
                    <td>
                      {editingRecord === record._id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => handleSaveEdit(record._id)}
                            className="icon-button"
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: '16px',
                              background: '#4caf50',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: 'white',
                              transition: 'all 0.3s ease',
                              fontWeight: 'bold'
                            }}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="icon-button"
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: '16px',
                              background: '#666',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: 'white',
                              transition: 'all 0.3s ease',
                              fontWeight: 'bold'
                            }}
                            title="Cancel"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => handleEdit(record)}
                            className="icon-button"
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: '16px',
                              background: '#ff9800',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: 'white',
                              transition: 'all 0.3s ease',
                              fontWeight: 'bold'
                            }}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteClick(record._id)}
                            className="icon-button"
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: '16px',
                              background: '#f44336',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: 'white',
                              transition: 'all 0.3s ease',
                              fontWeight: 'bold'
                            }}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
        {searchProduct || filterDate ? (
          <>
            Showing: <strong>{records.length}</strong> of <strong>{allRecords.length}</strong> records
          </>
        ) : (
          <>Total Records: <strong>{records.length}</strong> (from database: <strong>{allRecords.length}</strong>)</>
        )}
        <div style={{ marginTop: '5px', fontSize: '12px', color: '#999' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Delete</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this record?</p>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                onClick={handleDeleteCancel}
                className="modal-button-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="modal-button-delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

