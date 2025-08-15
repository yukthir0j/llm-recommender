import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, MessageSquare, Paperclip, ArrowUp, User, Bot, X } from 'lucide-react';

// --- IMPORTANT ---
// For this to work, you MUST save your company logo file to this exact path:
// frontend/client/src/logo.jpg
import companyLogo from './logo.jpg';


// --- Main App Component ---
function App() {
  const [conversations, setConversations] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(() => uuidv4());
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId]);

  const createNewConversation = () => {
    const newId = uuidv4();
    setConversations(prev => ({
      ...prev,
      [newId]: { id: newId, name: `New Chat`, messages: [] }
    }));
    setActiveConversationId(newId);
    setFile(null); // Clear file on new chat
  };
  
  useEffect(() => {
    if (Object.keys(conversations).length === 0) {
      createNewConversation();
    }
  }, [conversations]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!prompt.trim() && !file) || !activeConversationId) return;

    setLoading(true);

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      text: prompt,
      file: file ? { name: file.name, type: file.type } : null,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = conversations[activeConversationId]?.messages || [];
    const updatedName = currentMessages.length === 0 ? (prompt.substring(0, 25) + (prompt.length > 25 ? '...' : '')) : conversations[activeConversationId].name;

    setConversations(prev => ({
      ...prev,
      [activeConversationId]: {
        ...prev[activeConversationId],
        name: updatedName,
        messages: [...currentMessages, userMessage],
      }
    }));
    
    const tempPrompt = prompt;
    const tempFile = file;
    setPrompt('');
    setFile(null);

    const formData = new FormData();
    formData.append('prompt', tempPrompt);
    formData.append('user_id', userId);
    if (tempFile) {
      formData.append('file', tempFile);
    }

    try {
      // This now correctly points to your local backend for ALL requests.
      const response = await fetch('http://127.0.0.1:8000/chat/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`The server responded with an error: ${response.status}`);
      }

      const data = await response.json();
      const botMessageData = data[data.length - 1];
      
      const botMessage = {
        id: botMessageData.id,
        role: 'bot',
        text: botMessageData.text || 'I received an empty response.',
        file_url: botMessageData.file_url,
        timestamp: botMessageData.timestamp,
      };

      setConversations(prev => ({
        ...prev,
        [activeConversationId]: {
          ...prev[activeConversationId],
          messages: [...(prev[activeConversationId]?.messages || []), botMessage],
        }
      }));

    } catch (err) {
      console.error(err);
      const errorMessage = {
        id: uuidv4(),
        role: 'bot',
        text: `❌ An error occurred. Please check the backend console for details. [${err.message}]`,
        timestamp: new Date().toISOString(),
      };
      setConversations(prev => ({
        ...prev,
        [activeConversationId]: {
          ...prev[activeConversationId],
          messages: [...(prev[activeConversationId]?.messages || []), errorMessage],
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const activeMessages = conversations[activeConversationId]?.messages || [];

  return (
    <>
      <style>
        {`
          @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.9; } }
          .logo-pulse { animation: pulse 4s ease-in-out infinite; }
          .prose { max-width: 65ch; }
        `}
      </style>
      <div className="flex h-screen w-screen bg-gray-800 text-white font-sans">
        <Sidebar 
          conversations={Object.values(conversations)}
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          createNewConversation={createNewConversation}
        />
        
        <ChatView
          messages={activeMessages}
          loading={loading}
          prompt={prompt}
          setPrompt={setPrompt}
          setFile={setFile}
          handleSubmit={handleSubmit}
          messagesEndRef={messagesEndRef}
          fileInputRef={fileInputRef}
          file={file}
        />
      </div>
    </>
  );
}

// --- Sidebar Component ---
const Sidebar = ({ conversations, activeConversationId, setActiveConversationId, createNewConversation }) => {
  return (
    <div className="w-64 bg-gray-900 p-4 flex flex-col h-full border-r border-gray-700 shrink-0">
      <div className="flex items-center mb-6">
        <img src={companyLogo} alt="Company Logo" className="w-10 h-10 mr-3 logo-pulse rounded-md" />
        <h1 className="text-xl font-bold tracking-wider">LLM Recommender</h1>
      </div>

      <button
        onClick={createNewConversation}
        className="flex items-center justify-center w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity mb-6"
      >
        <Plus size={20} className="mr-2" />
        New Chat
      </button>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        <h2 className="text-sm font-semibold text-gray-400 mb-2 px-2">History</h2>
        {conversations.map(convo => (
          <div
            key={convo.id}
            onClick={() => setActiveConversationId(convo.id)}
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
              activeConversationId === convo.id ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
          >
            <MessageSquare size={16} className="text-gray-400 mr-3 shrink-0" />
            <span className="truncate text-sm">{convo.name}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-auto text-xs text-gray-500 pt-4 border-t border-gray-700">
        <p>Made with 💜 at Caze Labs</p>
        <p>v25.0 (Final Stable)</p>
      </div>
    </div>
  );
};

// --- Chat View Component ---
const ChatView = ({ messages, loading, prompt, setPrompt, setFile, handleSubmit, messagesEndRef, fileInputRef, file }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-800">
      <main className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && !loading ? (
          <WelcomeScreen />
        ) : (
          messages.map((msg, index) => <ChatMessage key={msg.id || index} message={msg} />)
        )}
        {loading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          {file && (
            <div className="mb-2 flex items-center justify-between bg-gray-600 px-3 py-1 rounded-md text-sm">
              <span>Attached: {file.name}</span>
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-gray-700 rounded-xl p-2 flex items-center w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <textarea
              className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none px-4"
              placeholder="Ask me anything, or upload a file..."
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || (!prompt.trim() && !file)}
              className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp size={20} />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

// --- Individual Chat Message Component ---
const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  const renderFile = () => {
    if (!message.file && !message.file_url) return null;
    if (message.file) {
        return <div className="mt-2 p-2 bg-gray-600 rounded-lg text-xs">Attached: {message.file.name}</div>;
    }
    if (message.file_url) {
      return <a href={`http://127.0.0.1:8000${message.file_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline block mt-2">View Attached File</a>;
    }
    return null;
  };

  return (
    <div className={`flex items-start gap-4 my-6`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-500' : 'bg-purple-500'}`}>
        {isUser ? <User size={20} /> : <img src={companyLogo} alt="AI" className="w-6 h-6 rounded-full" />}
      </div>
      <div className="flex flex-col">
        <p className="font-bold">{isUser ? 'You' : 'AI Assistant'}</p>
        <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') }}></div>
        {renderFile()}
      </div>
    </div>
  );
};

// --- Welcome Screen Component ---
const WelcomeScreen = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <img src={companyLogo} alt="Company Logo" className="w-24 h-24 mb-6 logo-pulse rounded-md" />
    <h2 className="text-4xl font-bold mb-2">How can I help you today?</h2>
    <p className="text-gray-400">Start a conversation, upload a file, or ask for a model recommendation.</p>
  </div>
);

// --- Loading Indicator Component ---
const LoadingIndicator = () => (
    <div className="flex items-start gap-4 my-6">
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            <img src={companyLogo} alt="AI" className="w-6 h-6 rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col">
          <p className="font-bold">AI Assistant</p>
          <div className="flex items-center gap-2 pt-2">
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
          </div>
        </div>
    </div>
);

export default App;