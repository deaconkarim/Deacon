import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AddChild() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  // Fetch potential guardians (adult members)
  useEffect(() => {
    async function fetchGuardians() {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('member_type', 'adult')
          .order('firstname');

        if (error) throw error;
        setGuardians(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchGuardians();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Insert the child into members table
      const { data: childData, error: childError } = await supabase
        .from('members')
        .insert({
          firstname: formData.firstname,
          lastname: formData.lastname,
          birth_date: formData.birth_date,
          member_type: 'child',
          ...(formData.gender && { gender: formData.gender })
        })
        .select()
        .single();

      if (childError) throw childError;

      // 2. Insert allergies if provided
      if (formData.allergies) {
        const { error: allergiesError } = await supabase
          .from('child_allergies')
          .insert({
            child_id: childData.id,
            allergies: formData.allergies
          });

        if (allergiesError) throw allergiesError;
      }

      // 3. Insert emergency contact if provided
      if (formData.emergency_contact_name) {
        const { error: emergencyError } = await supabase
          .from('child_emergency_contacts')
          .insert({
            child_id: childData.id,
            contact_name: formData.emergency_contact_name,
            phone: formData.emergency_contact_phone,
            relationship: formData.emergency_contact_relationship
          });

        if (emergencyError) throw emergencyError;
      }

      // 4. Insert guardian relationships
      if (formData.guardian_ids.length > 0) {
        const guardianRelationships = formData.guardian_ids.map(guardian_id => ({
          child_id: childData.id,
          guardian_id: guardian_id,
          relationship: formData.guardian_relationships[guardian_id] || 'Parent'
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
      setLoading(false);
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Child</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
          Child added successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender (Optional)
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded"
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Guardians</h2>
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Allergies</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allergies (if any)
            </label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="List any allergies or medical conditions"
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship to Child
              </label>
              <input
                type="text"
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Child'}
          </button>
        </div>
      </form>
    </div>
  );
} 