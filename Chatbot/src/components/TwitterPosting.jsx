import React, { useState } from 'react';
import { X, Send, Sparkles, Loader2, Twitter } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const TwitterPosting = ({ isOpen, onClose }) => {
  const [context, setContext] = useState('');
  const [generatedTweet, setGeneratedTweet] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  const handleGenerateTweet = async () => {
    if (!context.trim()) {
      toast.error('Please enter a context or topic for your tweet');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('http://localhost:9000/api/ai/generate', {
        context: context,
        options: {
          tone: 'engaging',
          includeHashtags: true,
          includeEmojis: true,
          maxLength: 280
        }
      });

      if (response.data.success) {
        setGeneratedTweet(response.data.data.content);
        setCharacterCount(response.data.data.characterCount);
        toast.success('Tweet generated successfully!');
      }
    } catch (error) {
      console.error('Error generating tweet:', error);
      toast.error('Failed to generate tweet. Make sure Twitter service is running on port 9000.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostToTwitter = async () => {
    if (!generatedTweet.trim()) {
      toast.error('No tweet content to publish');
      return;
    }

    if (generatedTweet.length > 280) {
      toast.error('Tweet exceeds 280 characters limit');
      return;
    }

    setIsPosting(true);
    try {
      const response = await axios.post('http://localhost:9000/api/twitter/post', {
        text: generatedTweet
      });

      if (response.data.success) {
        toast.success('Tweet posted to Twitter/X successfully!');
        setGeneratedTweet('');
        setContext('');
        setCharacterCount(0);
        
        // Show tweet URL if available
        if (response.data.data.url) {
          setTimeout(() => {
            toast.info(`View your tweet: ${response.data.data.url}`, { autoClose: 10000 });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Failed to post to Twitter: ${errorMsg}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleTweetChange = (e) => {
    const text = e.target.value;
    if (text.length <= 280) {
      setGeneratedTweet(text);
      setCharacterCount(text.length);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Twitter className="w-6 h-6 text-blue-400" />
            Twitter/X AI Post Generator
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
          {/* Context Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What would you like to tweet about?
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., AI innovations in 2026, My experience at HackIndia, Web3 future..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateTweet}
            disabled={isGenerating || !context.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Tweet with AI
              </>
            )}
          </button>

          {/* Generated Tweet Preview */}
          {generatedTweet && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">
                  Generated Tweet (Edit before posting)
                </label>
                <span className={`text-sm font-medium ${
                  characterCount > 280 ? 'text-red-500' : 
                  characterCount > 260 ? 'text-yellow-500' : 
                  'text-gray-400'
                }`}>
                  {characterCount}/280
                </span>
              </div>
              <textarea
                value={generatedTweet}
                onChange={handleTweetChange}
                rows={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Character count warning */}
              {characterCount > 260 && characterCount <= 280 && (
                <p className="text-sm text-yellow-500">
                  ⚠️ Close to character limit
                </p>
              )}
              {characterCount > 280 && (
                <p className="text-sm text-red-500">
                  ❌ Tweet exceeds 280 character limit
                </p>
              )}

              {/* Post to Twitter Button */}
              <button
                onClick={handlePostToTwitter}
                disabled={isPosting || characterCount > 280 || !generatedTweet.trim()}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Posting to Twitter/X...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Post to Twitter/X
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> The AI will generate an engaging tweet optimized for Twitter/X with relevant hashtags and emojis. Maximum 280 characters. You can edit the generated tweet before posting.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI-powered content</span>
            </div>
            <div className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-blue-400" />
              <span>Direct Twitter API</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">#️⃣</span>
              <span>Auto hashtags</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">😊</span>
              <span>Smart emojis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterPosting;
