import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Eye,
  CheckCircle2, XCircle, AlertTriangle, ChevronLeft, 
  ChevronRight, MapPin, Tag, FileText, Link as LinkIcon, 
  ShieldAlert, Filter, X, ClipboardList, Copy, Check, UploadCloud
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import Modal from '../components/Modal';

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [states, setStates] = useState([]);
  const [stateCounts, setStateCounts] = useState({});

  // Filter Dropdown State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    schemeTitle: '', slug: '', schemetype: '', state: '', aboutScheme: '', officialSourceUrl: '', isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Pickup Scheme Title State
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupState, setPickupState] = useState('');
  const [pickupTitles, setPickupTitles] = useState([]);
  const [isPickupLoading, setIsPickupLoading] = useState(false);
  const [hasCopiedPickup, setHasCopiedPickup] = useState(false);

  // View Scheme State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewScheme, setViewScheme] = useState(null);
  const [hasCopiedView, setHasCopiedView] = useState(false);

  // Bulk Add State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const predefinedStates = [
    'All India', 'Bihar', 'Uttar Pradesh', 'Gujarat', 'Jharkhand', 
    'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi', 'Punjab', 
    'Tamil Nadu', 'West Bengal', 'Karnataka'
  ];

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStates = async () => {
    try {
      const response = await api.get('/schemes/getSchemeStateNameOnly');
      const data = response.data.data || [];
      const counts = {};
      data.forEach(item => { if (item.state) counts[item.state] = item.count; });
      setStateCounts(counts);

      const dbStates = data.map(item => item.state).filter(Boolean);
      const combined = Array.from(new Set([...predefinedStates, ...dbStates])).sort();
      setStates(combined);
    } catch (err) {
      console.error('Failed to fetch states:', err);
      setStates([...predefinedStates].sort());
    }
  };

  const fetchSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10, search };
      if (stateFilter !== 'All') params.state = stateFilter;
      const response = await api.get('/schemes/', { params });
      setSchemes(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setError('Unable to load schemes. Please check your network connection.');
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, [page, stateFilter]);
  useEffect(() => { fetchStates(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSchemes();
  };

  const toggleStatus = async (scheme) => {
    try {
      const response = await api.put(`/schemes/${scheme._id}`, { data: { isActive: !scheme.isActive } });
      if (response.data.success) {
        setSchemes(schemes.map(s => s._id === scheme._id ? { ...s, isActive: !s.isActive } : s));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const deleteScheme = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheme? This action cannot be undone.')) return;
    try {
      const response = await api.delete(`/schemes/${id}`);
      if (response.data.success) setSchemes(schemes.filter(s => s._id !== id));
    } catch (error) {
      console.error('Failed to delete scheme:', error);
    }
  };

  const openModal = (scheme = null) => {
    if (scheme) {
      setEditingId(scheme._id);
      setFormData({
        schemeTitle: scheme.schemeTitle || '', slug: scheme.slug || '', schemetype: scheme.schemetype || '', 
        state: scheme.state || '', aboutScheme: scheme.aboutScheme || '', officialSourceUrl: scheme.officialSourceUrl || '', isActive: scheme.isActive ?? true
      });
    } else {
      setEditingId(null);
      setFormData({ schemeTitle: '', slug: '', schemetype: '', state: '', aboutScheme: '', officialSourceUrl: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/schemes/${editingId}`, { data: formData });
      } else {
        await api.post('/schemes/add', { data: formData });
      }
      setIsModalOpen(false);
      fetchSchemes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save scheme');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Pickup Titles Logic ---
  const handlePickupStateChange = async (e) => {
    const selectedState = e.target.value;
    setPickupState(selectedState);
    setHasCopiedPickup(false);
    if (!selectedState) return setPickupTitles([]);

    setIsPickupLoading(true);
    try {
      const response = await api.get('/schemes/', { params: { state: selectedState, limit: 500 } });
      setPickupTitles((response.data.data || []).map(s => s.schemeTitle));
    } catch (err) {
      setPickupTitles([]);
    } finally {
      setIsPickupLoading(false);
    }
  };

  const copyPickupToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(pickupTitles, null, 2));
    setHasCopiedPickup(true);
    setTimeout(() => setHasCopiedPickup(false), 2000);
  };

  // --- View Scheme Logic ---
  const openViewModal = (scheme) => {
    setViewScheme(scheme);
    setIsViewModalOpen(true);
    setHasCopiedView(false);
  };

  const copyViewJsonToClipboard = () => {
    // Excluding MongoDB internal fields for a cleaner JSON copy if needed, or copy full
    const { _id, __v, createdAt, updatedAt, ...cleanScheme } = viewScheme;
    navigator.clipboard.writeText(JSON.stringify(cleanScheme, null, 2));
    setHasCopiedView(true);
    setTimeout(() => setHasCopiedView(false), 2000);
  };

  // --- Bulk Add Logic ---
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkError(null);
    let parsedData;

    try {
      parsedData = JSON.parse(bulkJson);
      if (!Array.isArray(parsedData)) {
        throw new Error("Invalid format: JSON must be an Array of objects [{}, {}].");
      }
      if (parsedData.length === 0) {
        throw new Error("JSON array is empty.");
      }
      for (let i = 0; i < parsedData.length; i++) {
        if (!parsedData[i].schemeTitle) {
          throw new Error(`Item at index ${i} is missing the required 'schemeTitle' field.`);
        }
      }
    } catch (err) {
      setBulkError(err.message || "Invalid JSON syntax. Please check your data.");
      return;
    }

    setIsBulkSaving(true);
    try {
      // Loop sequence to upload bulk data using existing single add endpoint
      for (const item of parsedData) {
        await api.post('/schemes/add', { data: item });
      }
      setIsBulkModalOpen(false);
      setBulkJson('');
      fetchSchemes();
      alert(`Successfully added ${parsedData.length} schemes!`);
    } catch (err) {
      setBulkError(err.response?.data?.message || "Server Error: Failed to upload some schemes. Check for duplicates.");
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Schemes Manager</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage, monitor, and update government schemes & yojanas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => { setBulkJson(''); setBulkError(null); setIsBulkModalOpen(true); }}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <UploadCloud size={18} />
            Bulk Upload JSON
          </button>
          <button 
            onClick={() => openModal()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add New Scheme
          </button>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto flex-1">
            <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by scheme title or slug..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-gray-400"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Dropdown Filter */}
              <div className="relative w-full sm:w-auto" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-bold transition-all w-full sm:w-auto cursor-pointer",
                    isFilterOpen || stateFilter !== 'All' 
                      ? "border-indigo-500 text-indigo-700 ring-4 ring-indigo-500/10" 
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  <Filter size={16} className={stateFilter !== 'All' ? "text-indigo-600" : "text-gray-400"} />
                  State Filter
                  {stateFilter !== 'All' && <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] ml-1">1</span>}
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 sm:left-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-200">
                    <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar">
                      <button onClick={() => { setStateFilter('All'); setIsFilterOpen(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all mb-1 cursor-pointer", stateFilter === 'All' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50")}>All States</button>
                      {states.map(state => (
                        <button key={state} onClick={() => { setStateFilter(state); setIsFilterOpen(false); }} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all mb-1 cursor-pointer", stateFilter === state ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50")}>
                          <span className="truncate">{state}</span>
                          {stateCounts[state] > 0 && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-bold", stateFilter === state ? "bg-indigo-100/50" : "bg-gray-100 text-gray-400")}>{stateCounts[state]}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Scheme Button */}
              <button onClick={() => { setPickupState(''); setPickupTitles([]); setHasCopiedPickup(false); setIsPickupModalOpen(true); }} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer w-full sm:w-auto shrink-0">
                <ClipboardList size={16} className="text-gray-500" />
                Pickup Titles
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Tag */}
        {stateFilter !== 'All' && (
          <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Filter:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold shadow-sm">
              <MapPin size={12} className="text-indigo-500" /> {stateFilter}
              <div className="w-px h-3 bg-indigo-200 mx-0.5"></div>
              <button onClick={() => setStateFilter('All')} className="hover:text-indigo-900 hover:bg-indigo-200 rounded p-0.5 transition-colors cursor-pointer" title="Clear Filter"><X size={12} strokeWidth={3} /></button>
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-800">Connection Error</h3>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Scheme Details</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Location & Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5"><div className="h-10 bg-gray-200 rounded-xl w-3/4"></div></td>
                    <td className="px-6 py-5"><div className="h-6 bg-gray-200 rounded-md w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-6 bg-gray-200 rounded-lg w-20"></div></td>
                    <td className="px-6 py-5"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                    <td className="px-6 py-5"><div className="h-8 bg-gray-200 rounded-lg w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : schemes.length > 0 ? schemes.map((scheme) => (
                <tr key={scheme._id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5 max-w-[300px]">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                        <FileText size={18} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 truncate" title={scheme.schemeTitle}>{scheme.schemeTitle}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[200px]">/{scheme.slug}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                      <MapPin size={14} className="text-gray-400" /> {scheme.state || 'All India'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Tag size={12} className="text-indigo-400" />
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{scheme.schemetype || 'General'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {scheme.officialSourceUrl ? (
                      <a href={scheme.officialSourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all">
                        <LinkIcon size={12} /> Source
                      </a>
                    ) : <span className="text-xs text-gray-400 italic">No URL</span>}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <button onClick={() => toggleStatus(scheme)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-all hover:scale-105 active:scale-95", scheme.isActive !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200")}>
                      {scheme.isActive !== false ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {scheme.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {/* VIEW BUTTON ADDED HERE */}
                      <button onClick={() => openViewModal(scheme)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openModal(scheme)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer" title="Edit Details">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteScheme(scheme._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete Scheme">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4"><Search size={24} className="text-gray-400" /></div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">No schemes found</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Adjust your search or filters to find what you are looking for.</p>
                      <button onClick={() => {setSearch(''); setStateFilter('All');}} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Clear Filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500 font-semibold">Showing Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span></p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-all cursor-pointer"><ChevronLeft size={16} strokeWidth={2.5} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-all cursor-pointer"><ChevronRight size={16} strokeWidth={2.5} /></button>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT SCHEME MODAL (Unchanged functionality, styling modern) --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Scheme Details" : "Create New Scheme"}>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Inputs exactly as before */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Scheme Title <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.schemeTitle} onChange={e => setFormData({...formData, schemeTitle: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">URL Slug</label>
              <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Category</label>
              <input type="text" value={formData.schemetype} onChange={e => setFormData({...formData, schemetype: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">State</label>
              <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all">
                <option value="">-- Select State --</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Official Source URL <span className="text-red-500">*</span></label>
              <input type="url" required value={formData.officialSourceUrl} onChange={e => setFormData({...formData, officialSourceUrl: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">About Scheme</label>
              <textarea value={formData.aboutScheme} onChange={e => setFormData({...formData, aboutScheme: e.target.value})} rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-y" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 border rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Scheme'}</button>
          </div>
        </form>
      </Modal>

      {/* --- NEW: VIEW SCHEME MODAL --- */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Scheme Details">
        {viewScheme && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
               <div>
                 <h3 className="text-lg font-black text-gray-900">{viewScheme.schemeTitle}</h3>
                 <p className="text-xs text-gray-400 font-mono mt-1">/{viewScheme.slug}</p>
               </div>
               <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", viewScheme.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                  {viewScheme.isActive ? 'Active' : 'Inactive'}
               </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">State</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{viewScheme.state || 'All India'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type / Category</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{viewScheme.schemetype || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Official Source</p>
               {viewScheme.officialSourceUrl ? (
                 <a href={viewScheme.officialSourceUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-600 hover:underline mt-0.5 break-all">
                   {viewScheme.officialSourceUrl}
                 </a>
               ) : <p className="text-sm text-gray-500 italic mt-0.5">Not provided</p>}
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">About Scheme</p>
               <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                 {viewScheme.aboutScheme || <span className="italic text-gray-400">No description available.</span>}
               </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">Close</button>
              <button 
                onClick={copyViewJsonToClipboard}
                className={cn("flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all", hasCopiedView ? "bg-green-100 text-green-700" : "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                {hasCopiedView ? <Check size={16} /> : <Copy size={16} />}
                {hasCopiedView ? 'Copied JSON!' : 'Copy Data as JSON'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- NEW: BULK UPLOAD MODAL --- */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Upload Schemes (JSON)">
        <form onSubmit={handleBulkSubmit} className="space-y-4 pt-2">
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle size={14} /> Format Guidelines</h4>
            <p className="text-xs text-indigo-600 mb-2">Ensure your data is a valid JSON Array containing scheme objects. <strong className="font-bold">schemeTitle</strong> is strictly required for each item.</p>
            <pre className="text-[10px] text-indigo-700 bg-indigo-100/50 p-2 rounded-lg font-mono">
{`[
  {
    "schemeTitle": "PM Kisan",
    "state": "All India",
    "isActive": true
  }
]`}
            </pre>
          </div>

          {bulkError && (
             <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2">
               <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
               <p className="text-xs font-bold text-red-700">{bulkError}</p>
             </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Paste JSON Array Here</label>
            <textarea 
              value={bulkJson} 
              onChange={e => setBulkJson(e.target.value)}
              rows={8}
              placeholder="Paste your JSON array [...] here..."
              className="w-full bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl border border-gray-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 custom-scrollbar resize-y"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
            <button type="submit" disabled={isBulkSaving || !bulkJson.trim()} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-all">
              {isBulkSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <UploadCloud size={16} />}
              {isBulkSaving ? 'Uploading...' : 'Validate & Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- PICKUP SCHEME TITLE MODAL --- */}
      <Modal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} title="Pickup Scheme Titles">
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select State</label>
            <select value={pickupState} onChange={handlePickupStateChange} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
              <option value="">-- Choose a State --</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {isPickupLoading ? (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-gray-500">Fetching titles...</p>
            </div>
          ) : pickupState && pickupTitles.length > 0 ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{pickupTitles.length} Titles Found</span>
                <button onClick={copyPickupToClipboard} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", hasCopiedPickup ? "bg-green-100 text-green-700" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100")}>
                  {hasCopiedPickup ? <Check size={14} /> : <Copy size={14} />} {hasCopiedPickup ? 'Copied Array!' : 'Copy JSON Array'}
                </button>
              </div>
              <pre className="w-full bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-60 custom-scrollbar whitespace-pre-wrap break-words border border-gray-800">
                {JSON.stringify(pickupTitles, null, 2)}
              </pre>
            </div>
          ) : pickupState && pickupTitles.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p className="text-sm font-semibold text-gray-500">No schemes found for this state.</p></div>
          ) : (
             <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200"><ClipboardList size={24} className="mx-auto text-gray-300 mb-2" /><p className="text-sm font-semibold text-gray-500">Select a state above to generate the array.</p></div>
          )}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsPickupModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all cursor-pointer">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}