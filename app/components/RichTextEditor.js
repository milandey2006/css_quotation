"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import react-quill-new to avoid SSR issues with 'document is not defined'
const ReactQuill = dynamic(() => import('react-quill-new'), { 
    ssr: false,
    loading: () => <div className="min-h-[150px] bg-gray-50 flex items-center justify-center rounded border border-gray-200 text-sm text-gray-400">Loading editor...</div>
});

const RichTextEditor = ({ value, onChange, placeholder = "Write description here..." }) => {
  // Memoize modules so the editor doesn't re-render and lose focus
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet'
  ];

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden text-sm group transition-all duration-200 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 text-gray-900">
      <ReactQuill 
        theme="snow" 
        value={value || ''} 
        onChange={onChange} 
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="[&_.ql-editor]:min-h-[60px] [&_.ql-editor]:max-h-[300px] [&_.ql-editor]:text-gray-900 [&_.ql-editor]:whitespace-pre-wrap [&_.ql-editor]:break-words [&_.ql-editor.ql-blank::before]:text-gray-500 [&_.ql-editor.ql-blank::before]:font-normal [&_.ql-container]:border-0 [&_.ql-toolbar]:hidden group-focus-within:[&_.ql-toolbar]:block [&_.ql-toolbar]:border-t-0 [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-b-gray-200 [&_.ql-toolbar]:bg-gray-50"
      />
    </div>
  );
};

export default RichTextEditor;
