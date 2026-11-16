import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface ReceiptViewerModalProps {
  url: string;
  fileName?: string;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  url,
  fileName = 'Receipt',
  onClose,
}) => {
  const isPdf = url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf');

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'receipt_download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{fileName}</h3>
              <p className="text-[10px] text-zinc-500">Receipt Attachment</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
              title="Download receipt"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="modal-body p-4 flex items-center justify-center bg-zinc-950/70 overflow-auto">
          {isPdf ? (
            <div className="text-center p-8 space-y-4">
              <FileText size={48} className="mx-auto text-emerald-400" />
              <p className="text-sm text-zinc-300">PDF Document Attachment</p>
              <button
                onClick={handleDownload}
                className="btn-primary"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          ) : (
            <div className="relative max-h-[70vh] flex items-center justify-center">
              <img
                src={url}
                alt="Receipt Preview"
                className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-lg border border-zinc-800"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer justify-between">
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-1.5"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary text-xs py-1.5"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
