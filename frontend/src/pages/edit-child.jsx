import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditChild() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [guardians, setGuardians] = useState([]);
  
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    birth_date: '',
    gender: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    guardian_ids: [],
    guardian_relationships: {}
  });
  const [childData, setChildData] = useState(null);

  // Fetch child data and guardians
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch child data
        const { data: childData, error: childError } = await supabase
          .from('members')
          .select('*')
          .eq('id', childId)
          .single();

        if (childError) throw childError;

        setChildData(childData);

        // Fetch potential guardians (adult members)
        const { data: guardiansData, error: guardiansError } = await supabase
          .from('members')
          .select('*')
          .eq('member_type', 'adult')
          .order('firstname');

        if (guardiansError) throw guardiansError;

        // Fetch current guardian relationships
        const { data: currentGuardiansData, error: currentGuardiansError } = await supabase
          .from('child_guardians')
          .select('guardian_id, relationship')
          .eq('child_id', childId);

        if (currentGuardiansError) throw currentGuardiansError;

        // Fetch allergies
        const { data: allergiesData, error: allergiesError } = await supabase
          .from('child_allergies')
          .select('*')
          .eq('child_id', childId);

        if (allergiesError) throw allergiesError;

        // Set form data
        setFormData({
          firstname: childData.firstname || '',
          lastname: childData.lastname || '',
          birth_date: childData.birth_date || '',
          gender: childData.gender || '',
          allergies: allergiesData?.map(a => `${a.allergy_name} (${a.severity})`).join(', ') || '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          emergency_contact_relationship: '',
          guardian_ids: currentGuardiansData?.map(g => g.guardian_id) || [],
          guardian_relationships: currentGuardiansData?.reduce((acc, g) => {
            acc[g.guardian_id] = g.relationship || 'Parent';
            return acc;
          }, {}) || {}
        });

        setGuardians(guardiansData || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [childId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Update the child in members table
      const { error: childError } = await supabase
        .from('members')
        .update({
          firstname: formData.firstname,
          lastname: formData.lastname,
          birth_date: formData.birth_date,
          gender: formData.gender
        })
        .eq('id', childId)
        .eq('organization_id', childData?.organization_id);

      if (childError) throw childError;

      // 2. Update allergies if provided
      if (formData.allergies) {
        // Remove existing allergies
        const { error: deleteAllergiesError } = await supabase
          .from('child_allergies')
          .delete()
          .eq('child_id', childId);

        if (deleteAllergiesError) throw deleteAllergiesError;

        // Parse allergies and insert new ones
        const allergyEntries = formData.allergies.split(',').map(entry => entry.trim()).filter(entry => entry);
        if (allergyEntries.length > 0) {
          const allergiesToInsert = allergyEntries.map(entry => {
            // Try to parse "allergy_name (severity)" format
            const match = entry.match(/^(.+?)\s*\((\w+)\)$/);
            if (match) {
              return {
                child_id: childId,
                allergy_name: match[1].trim(),
                severity: match[2].toLowerCase(),
                notes: ''
              };
            } else {
              // Default to moderate severity if no severity specified
              return {
                child_id: childId,
                allergy_name: entry,
                severity: 'moderate',
                notes: ''
              };
            }
          });

          const { error: allergiesError } = await supabase
            .from('child_allergies')
            .insert(allergiesToInsert);

          if (allergiesError) throw allergiesError;
        }
      }

      // 3. Remove all current guardian relationships
      const { error: deleteError } = await supabase
        .from('child_guardians')
        .delete()
        .eq('child_id', childId);

      if (deleteError) throw deleteError;

              // 4. Insert new guardian relationships
        if (formData.guardian_ids.length > 0) {
          const guardianRelationships = formData.guardian_ids.map(guardian_id => ({
            child_id: childId,
            guardian_id: guardian_id,
            relationship: formData.guardian_relationships[guardian_id] || 'Parent',
            organization_id: childData?.organization_id
          }));

          const { error: guardianError } = await supabase
            .from('child_guardians')
            .insert(guardianRelationships);

          if (guardianError) throw guardianError;
        }

      setSuccess(true);
      // Redirect to children check-in page after 2 seconds
      setTimeout(() => {
        navigate('/children-check-in');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardianChange = (e) => {
    const options = e.target.options;
    const selectedIds = [];
    const relationships = { ...formData.guardian_relationships };
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const guardianId = options[i].value;
        selectedIds.push(guardianId);
        // Initialize relationship if not already set
        if (!relationships[guardianId]) {
          relationships[guardianId] = '';
        }
      } else {
        // Remove relationship if guardian is deselected
        delete relationships[options[i].value];
      }
    }
    
    setFormData(prev => ({
      ...prev,
      guardian_ids: selectedIds,
      guardian_relationships: relationships
    }));
  };

  const handleRelationshipChange = (guardianId, relationship) => {
    setFormData(prev => ({
      ...prev,
      guardian_relationships: {
        ...prev.guardian_relationships,
        [guardianId]: relationship
      }
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Child</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
          Child updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Child Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guardians */}
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Guardian Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Guardians (Hold Ctrl/Cmd to select multiple)
              </label>
              <select
                multiple
                name="guardian_ids"
                value={formData.guardian_ids}
                onChange={handleGuardianChange}
                required
                className="w-full p-2 border rounded"
                size="5"
              >
                {guardians.map(guardian => (
                  <option key={guardian.id} value={guardian.id}>
                    {guardian.firstname} {guardian.lastname}
                  </option>
                ))}
              </select>
            </div>

            {/* Guardian Relationships */}
            {formData.guardian_ids.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Guardian Relationships</h3>
                <div className="space-y-2">
                  {formData.guardian_ids.map(guardianId => {
                    const guardian = guardians.find(g => g.id === guardianId);
                    return (
                      <div key={guardianId} className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 min-w-[150px]">
                          {guardian.firstname} {guardian.lastname}:
                        </span>
                        <select
                          value={formData.guardian_relationships[guardianId] || ''}
                          onChange={(e) => handleRelationshipChange(guardianId, e.target.value)}
                          required
                          className="flex-1 p-2 border rounded"
                        >
                          <option value="">Select relationship</option>
                          <option value="Parent">Parent</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Legal Guardian">Legal Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Allergies</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allergies (if any)
            </label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="List any allergies or medical conditions"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/children-check-in')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 