import React, { useState, useRef } from 'react';
import Button from './Button';

const ChatInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend({ text: message });
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('[ChatInput] File selected:', file.name, file.size);

    if (file.size > 5 * 1024 * 1024) {
      alert('FILE_SIZE_EXCEEDED: Max 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('[ChatInput] Starting upload...');
      const res = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });

      console.log('[ChatInput] Upload response status:', res.status);

      if (!res.ok) throw new Error('UPLOAD_FAILED');

      const data = await res.json();
      console.log('[ChatInput] Upload successful, data:', data);

      if (data.url) {
        console.log('[ChatInput] Sending message with image URL:', data.url);
        onSend({ text: '', imageUrl: data.url });
      } else {
        console.error('[ChatInput] No URL returned from upload');
        alert('UPLOAD_ERROR: Server did not return a file URL');
      }
    } catch (error) {
      console.error('[ChatInput] Upload error:', error);
      alert(`UPLOAD_ERROR: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2 bg-black border-t border-terminal-green flex flex-col gap-2"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
      />

      <div className="flex items-end gap-2 px-2">
        <span className="text-terminal-green font-bold py-2 select-none min-w-[20px]">{'>'}</span>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isUploading}
          placeholder={isUploading ? "UPLOADING_DATA_PACKET... [||||||....]" : "_"}
          className="flex-1 bg-transparent text-terminal-green placeholder-terminal-green/50 border-none outline-none resize-none font-mono py-2 min-h-[40px] max-h-[120px] disabled:opacity-50"
          rows={1}
        />

        <div className="flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs uppercase hover:text-white text-terminal-dim disabled:opacity-30"
            title="Upload Media"
          >
            [ UPLOAD ]
          </button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!message.trim() || isUploading}
            className="text-xs"
          >
            SEND
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
