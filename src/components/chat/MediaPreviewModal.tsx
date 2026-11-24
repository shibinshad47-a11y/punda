'use client';

import React from 'react';
import { X, Download, FileText } from 'lucide-react';

interface MediaPreviewModalProps {
  url: string;
  type: 'image' | 'video' | 'file';
  fileName?: string;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  url,
  type,
  fileName = 'file',
  onClose,
}) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between text-white p-2 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-semibold truncate max-w-sm">{fileName}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="flex-1 flex items-center justify-center p-4 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={fileName}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
          />
        )}

        {type === 'video' && (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg shadow-2xl"
          />
        )}

        {type === 'file' && (
          <div className="bg-zinc-800 p-8 rounded-2xl flex flex-col items-center gap-4 text-center max-w-sm border border-zinc-700 text-white">
            <FileText className="w-16 h-16 text-emerald-500" />
            <div>
              <h4 className="font-bold text-base truncate">{fileName}</h4>
              <p className="text-xs text-zinc-400 mt-1">Ready for download</p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-2 text-center text-xs text-zinc-500 select-none">
        PUNDA Media Viewer
      </div>
    </div>
  );
};
