import React, { useState } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const LinkedInPosting = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleGeneratePost = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic for your LinkedIn post');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('http://localhost:4000/api/ai/posts/generate', {
        topic: topic,
        options: {
          tone: 'professional',
          length: 'medium',
          includeHashtags: true,
          includeEmojis: true
        }
      });

      if (response.data.success) {
        setGeneratedPost(response.data.data.content);
        toast.success('LinkedIn post generated successfully!');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error('Failed to generate post. Make sure LinkedIn service is running on port 4000.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostToLinkedIn = async () => {
    if (!generatedPost.trim()) {
      toast.error('No post content to publish');
      return;
    }

    setIsPosting(true);
    try {
      const response = await axios.post('http://localhost:4000/api/linkedin/posts/create', {
        content: generatedPost,
        visibility: 'public'
      });

      if (response.data.success) {
        toast.success('Post published to LinkedIn successfully!');
        setGeneratedPost('');
        setTopic('');
      }
    } catch (error) {
      console.error('Error posting to LinkedIn:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Failed to post to LinkedIn: ${errorMsg}`);
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            LinkedIn AI Post Generator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What would you like to post about?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AI in healthcare, Web3 innovations, Career growth tips..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleGeneratePost()}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGeneratePost}
            disabled={isGenerating || !topic.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Post with AI
              </>
            )}
          </button>

          {/* Generated Post Preview */}
          {generatedPost && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Generated Post (You can edit before posting)
              </label>
              <textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Post to LinkedIn Button */}
              <button
                onClick={handlePostToLinkedIn}
                disabled={isPosting}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publishing to LinkedIn...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Publish to LinkedIn
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> The AI will generate a professional LinkedIn post with engaging content, relevant hashtags, and emojis. You can edit the generated post before publishing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInPosting;
