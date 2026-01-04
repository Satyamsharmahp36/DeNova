import React from 'react';
import { Settings, MessageCircle, User, Database } from 'lucide-react';
import { useAppContext } from '../../Appcontext';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const { userData } = useAppContext();

  return (
    <div className="flex border-b border-gray-700 bg-gray-800 px-4">
      <button
        onClick={() => setActiveTab('prompt')}
        className={`px-6 py-4 text-sm font-medium transition-all ${
          activeTab === 'prompt'
            ? 'border-b-2 border-emerald-500 text-emerald-400 bg-gray-900 bg-opacity-30'
            : 'text-gray-400 hover:text-white hover:bg-gray-700 hover:bg-opacity-30'
        } rounded-t-lg`}
      >
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4" />
          <span>Knowledge & Workflow</span>
        </div>
      </button>
      <button
        onClick={() => setActiveTab('responseStyle')}
        className={`px-6 py-4 text-sm font-medium transition-all ${
          activeTab === 'responseStyle'
            ? 'border-b-2 border-emerald-500 text-emerald-400 bg-gray-900 bg-opacity-30'
            : 'text-gray-400 hover:text-white hover:bg-gray-700 hover:bg-opacity-30'
        } rounded-t-lg`}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4" />
          <span>Response Style</span>
        </div>
      </button>
      <button
        onClick={() => setActiveTab('contributions')}
        className={`px-6 py-4 text-sm font-medium transition-all ${
          activeTab === 'contributions'
            ? 'border-b-2 border-emerald-500 text-emerald-400 bg-gray-900 bg-opacity-30'
            : 'text-gray-400 hover:text-white hover:bg-gray-700 hover:bg-opacity-30'
        } rounded-t-lg`}
      >
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>User Contributions</span>
        </div>
      </button>
    </div>
  );
};

export default TabNavigation;