'use client';
import React, { useRef } from 'react';

// A textarea that shows each line's "label" in bold — the same part the
// quotation preview bolds (everything up to and including the first ":" or "-").
// This makes the points easy to spot while editing, without changing how the
// terms are stored (still plain newline-separated text).
//
// Technique: a read-only styled "backdrop" div rendered behind a textarea whose
// own text is transparent (only its caret shows). The two are kept pixel-aligned
// with identical font/padding/wrapping and scroll-synced, so the bold backdrop
// text appears to be the textarea's own content.
export default function HighlightedTermsTextarea({ value = '', onChange, rows = 10, placeholder, className = '' }) {
  const taRef = useRef(null);
  const backRef = useRef(null);

  const syncScroll = () => {
    if (backRef.current && taRef.current) {
      backRef.current.scrollTop = taRef.current.scrollTop;
      backRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  // Font/box metrics MUST match between the textarea and the backdrop.
  const shared = 'w-full h-full px-3 py-2.5 text-xs font-mono leading-[1.5] whitespace-pre-wrap break-words box-border';

  const lines = String(value).split('\n');

  return (
    <div className="relative rounded-md border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden">
      {/* Backdrop: same text, with the label part bolded */}
      <div
        ref={backRef}
        aria-hidden="true"
        className={`${shared} absolute inset-0 overflow-hidden pointer-events-none text-gray-900`}
      >
        {lines.map((line, i) => {
          const m = line.match(/^([^:\-]*)([:\-])([\s\S]*)$/);
          return (
            <React.Fragment key={i}>
              {m ? (<><b className="font-bold text-black">{m[1]}{m[2]}</b>{m[3]}</>) : line}
              {i < lines.length - 1 ? '\n' : ''}
            </React.Fragment>
          );
        })}
      </div>

      {/* Editable textarea on top, transparent text so only the caret shows */}
      <textarea
        ref={taRef}
        rows={rows}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className={`${shared} relative block bg-transparent border-0 outline-none resize-y ${className}`}
        style={{ color: 'transparent', caretColor: '#111827' }}
      />
    </div>
  );
}
