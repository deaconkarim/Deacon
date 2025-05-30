import React, { useState, useEffect } from 'react';
import { generateBulletin } from '../../lib/bulletinService';
import { getRecentDonations } from '../../lib/donationService';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const formatDonationAmounts = (donation) => {
  if (!donation.donation_amounts) return '';
  
  const amounts = donation.donation_amounts.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
    return acc;
  }, {});

  return Object.entries(amounts)
    .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
    .join(', ');
};

const BulletinForm = () => {
  const [donations, setDonations] = useState([]);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    monthlyPraise: '',
    monthlyPrayer: '',
    events: [{ title: '', description: '' }],
    announcements: [{ title: '', description: '' }],
    offerings: [
      {
        donationId: '',
        date: '',
        total: '',
        attendance: ''
      },
      {
        donationId: '',
        date: '',
        total: '',
        attendance: ''
      }
    ],
    songs: [{ title: '', singers: '' }],
    sermon: {
      title: '',
      scripture: ''
    }
  });

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const data = await getRecentDonations();
        setDonations(data);
      } catch (error) {
        console.error('Error fetching donations:', error);
      }
    };
    fetchDonations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (index, field, value, arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleOfferingChange = (index, donationId) => {
    const selectedDonation = donations.find(d => d.id === donationId);
    if (selectedDonation) {
      setFormData(prev => ({
        ...prev,
        offerings: prev.offerings.map((offering, i) => 
          i === index ? {
            ...offering,
            donationId: selectedDonation.id,
            date: selectedDonation.date,
            amount: selectedDonation.amount,
            attendance: selectedDonation.attendance
          } : offering
        )
      }));
    }
  };

  const handleSermonChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      sermon: {
        ...prev.sermon,
        [field]: value
      }
    }));
  };

  const addArrayItem = (arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { title: '', description: '' }]
    }));
  };

  const removeArrayItem = (index, arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await generateBulletin(formData);
      alert('Bulletin generated successfully!');
    } catch (error) {
      alert('Error generating bulletin. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Generate Bulletin</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Bulletin Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Monthly Praise & Prayer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Praise</label>
            <textarea
              name="monthlyPraise"
              value={formData.monthlyPraise}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter monthly praise..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Prayer</label>
            <textarea
              name="monthlyPrayer"
              value={formData.monthlyPrayer}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter monthly prayer..."
            />
          </div>
        </div>

        {/* Events Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Upcoming Events</h3>
            <button
              type="button"
              onClick={() => addArrayItem('events')}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </button>
          </div>
          {formData.events.map((event, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={event.title}
                  onChange={(e) => handleArrayChange(index, 'title', e.target.value, 'events')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Event Title"
                />
                <textarea
                  value={event.description}
                  onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'events')}
                  rows="2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Event Description"
                />
              </div>
              {formData.events.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, 'events')}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Announcements Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Announcements</h3>
            <button
              type="button"
              onClick={() => addArrayItem('announcements')}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Announcement
            </button>
          </div>
          {formData.announcements.map((announcement, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={announcement.title}
                  onChange={(e) => handleArrayChange(index, 'title', e.target.value, 'announcements')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Announcement Title"
                />
                <textarea
                  value={announcement.description}
                  onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'announcements')}
                  rows="2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Announcement Description"
                />
              </div>
              {formData.announcements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, 'announcements')}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Updated Offering Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Offerings (Last 2 Weeks)</h3>
          {formData.offerings.map((offering, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Week {index + 1}</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Donation</label>
                  <select
                    value={offering.donationId}
                    onChange={(e) => handleOfferingChange(index, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select a donation</option>
                    {donations.map((donation) => (
                      <option key={donation.id} value={donation.id}>
                        {new Date(donation.date).toLocaleDateString()} - ${donation.amount} - {donation.attendance} people
                      </option>
                    ))}
                  </select>
                </div>
                {offering.donationId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="text"
                        value={`$${offering.amount}`}
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Attendance</label>
                      <input
                        type="text"
                        value={offering.attendance}
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Songs Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Songs</h3>
            <button
              type="button"
              onClick={() => addArrayItem('songs')}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Song
            </button>
          </div>
          {formData.songs.map((song, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={song.title}
                  onChange={(e) => handleArrayChange(index, 'title', e.target.value, 'songs')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Song Title"
                />
                <input
                  type="text"
                  value={song.singers}
                  onChange={(e) => handleArrayChange(index, 'singers', e.target.value, 'songs')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Singers"
                />
              </div>
              {formData.songs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, 'songs')}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Sermon Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sermon</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={formData.sermon.title}
                onChange={(e) => handleSermonChange('title', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter sermon title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Scripture</label>
              <input
                type="text"
                value={formData.sermon.scripture}
                onChange={(e) => handleSermonChange('scripture', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter scripture reference"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Generate Bulletin
        </button>
      </form>
    </div>
  );
};

export default BulletinForm; 