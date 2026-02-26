import React, { useState } from 'react';
import { Service } from '../types';
import { Edit2, Plus, X, Save } from 'lucide-react';

export default function ServiceManagement({ 
  services, 
  setServices 
}: { 
  services: Service[], 
  setServices: React.Dispatch<React.SetStateAction<Service[]>> 
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setEditForm(service);
  };

  const handleSave = () => {
    if (editingId && editForm.name && editForm.price && editForm.durationMinutes) {
      setServices(services.map(s => s.id === editingId ? { ...s, ...editForm } as Service : s));
      setEditingId(null);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-serif text-slate-800">Service Menu</h2>
          <p className="text-slate-500 mt-1">Manage your offerings and pricing</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-colors shadow-sm">
          <Plus size={18} />
          <span>Add Service</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-medium">Service Name</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Duration</th>
              <th className="p-4 font-medium">Color</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  {editingId === service.id ? (
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="bg-white border border-slate-300 rounded px-3 py-1.5 w-full text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{service.name}</span>
                  )}
                </td>
                <td className="p-4">
                  {editingId === service.id ? (
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input 
                        type="number" 
                        value={editForm.price} 
                        onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                        className="bg-white border border-slate-300 rounded px-3 py-1.5 w-24 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-700 font-mono font-medium">${service.price}</span>
                  )}
                </td>
                <td className="p-4">
                  {editingId === service.id ? (
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={editForm.durationMinutes} 
                        onChange={(e) => setEditForm({...editForm, durationMinutes: Number(e.target.value)})}
                        className="bg-white border border-slate-300 rounded px-3 py-1.5 w-20 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-slate-500 ml-2">min</span>
                    </div>
                  ) : (
                        <span className="text-slate-600 text-sm">{service.durationMinutes} min</span>
                  )}
                </td>
                <td className="p-4">
                   <div className={`w-6 h-6 rounded-full border ${service.color.split(' ')[0]} ${service.color.split(' ')[1]}`}></div>
                </td>
                <td className="p-4 text-right">
                  {editingId === service.id ? (
                    <div className="flex justify-end space-x-2">
                      <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Save size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(service)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
