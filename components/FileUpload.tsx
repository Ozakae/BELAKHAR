'use client';

import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

export default function FileUpload({
  selectedFile,
  onFileSelect,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah PDF (.pdf), Word (.docx), atau Teks (.txt, .md).');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Ukuran berkas melebihi batas 10MB.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onFileSelect(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-primary">
          Berkas Materi Pembelajaran
        </label>
        <span className="text-xs text-muted">
          PDF, DOCX, TXT, atau MD (Maksimal 10MB, PDF maks 20 hal)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-all duration-150 ${
            disabled ? 'opacity-50 cursor-not-allowed bg-surface-subtle border-border-main/40' : ''
          } ${
            isDragging
              ? 'border-accent bg-accent/10 shadow-[2px_2px_0px_var(--shadow-color)] translate-x-0.5 translate-y-0.5'
              : 'border-border-main/50 bg-background shadow-[3px_3px_0px_var(--shadow-color)] hover:border-border-main hover:shadow-[4px_4px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 border-2 border-border-main bg-surface rounded-md flex items-center justify-center shadow-[2px_2px_0px_var(--shadow-color)]">
              <Upload className="w-5 h-5 text-accent" />
            </div>
            <div className="text-sm text-primary">
              <span className="font-bold text-accent underline underline-offset-2">
                Pilih berkas
              </span>{' '}
              atau seret berkas ke nampan ini
            </div>
            <p className="text-xs text-muted">
              Dokumen kuliah, materi bab, PDF, DOCX, atau catatan TXT
            </p>
          </div>
        </div>
      ) : (
        <div className="border-2 border-border-main bg-surface rounded-lg p-4 shadow-[4px_4px_0px_var(--shadow-color)] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 border-2 border-border-main bg-surface-subtle rounded-md flex items-center justify-center shrink-0 shadow-[2px_2px_0px_var(--shadow-color)]">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-primary truncate">
                {selectedFile.name}
              </div>
              <div className="text-xs text-muted font-mono">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="p-1.5 text-primary border-2 border-border-main rounded bg-surface hover:bg-surface-subtle shadow-[2px_2px_0px_var(--shadow-color)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Hapus berkas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 text-xs text-error bg-error-bg border border-error rounded">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
