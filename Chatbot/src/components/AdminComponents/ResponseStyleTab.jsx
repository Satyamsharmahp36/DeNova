import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Settings, Info, Save, X } from 'lucide-react';
import { useAppContext } from '../../Appcontext';

const ResponseStyleTab = ({ 
  responseStyleContent, 
  setResponseStyleContent, 
  updateResponseStyle, 
  clearResponseStyle,
  isLoading 
}) => {
  const { userData, refreshUserData } = useAppContext();

  const styleTemplates = [
    { name: "Professional", desc: "Formal and authoritative tone", example: "Maintain a formal business tone with professional language and structured responses." },
    { name: "Friendly", desc: "Casual and conversational", example: "Use a warm, approachable tone. Be conversational and relatable in responses." },
    { name: "Concise", desc: "Brief and to the point", example: "Keep responses short and direct. Avoid unnecessary elaboration." },
    { name: "Educational", desc: "Detailed with examples", example: "Provide thorough explanations with examples to help users understand concepts." },
    { name: "Creative", desc: "Imaginative and engaging", example: "Use creative language and metaphors. Make responses engaging and memorable." },
    { name: "Technical", desc: "Precise with terminology", example: "Use technical terminology and provide detailed, accurate explanations." }
  ];

  const handleUpdate = async () => {
    await updateResponseStyle();
    await refreshUserData();
  };

  const handleClear = async () => {
    await clearResponseStyle();
    await refreshUserData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Response Style</h3>
            <p className="text-sm text-gray-400">Customize your AI assistant's tone and behavior</p>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Quick Templates</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {styleTemplates.map((template, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setResponseStyleContent(template.example)}
                className="bg-gray-900 border border-gray-700 hover:border-emerald-500 rounded-lg p-4 text-left transition-all"
              >
                <div className="font-medium text-white mb-1">{template.name}</div>
                <div className="text-xs text-gray-400">{template.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Custom Instructions</h3>
          </div>
        </div>
        
        <div className="p-6">
          <textarea
            value={responseStyleContent}
            onChange={(e) => setResponseStyleContent(e.target.value)}
            className="w-full p-4 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg resize-none border border-gray-700 hover:border-gray-600 transition-colors"
            placeholder="Define how you want the AI to respond (e.g., professional, concise, technical...)..."
            rows={8}
            disabled={isLoading}
          />
          <div className="mt-2 text-xs text-gray-400">
            {responseStyleContent.length} characters
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleUpdate}
          disabled={isLoading}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{isLoading ? 'Saving...' : 'Save Response Style'}</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleClear}
          disabled={isLoading}
          className="py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          <X className="w-5 h-5" />
          <span>Clear</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ResponseStyleTab;