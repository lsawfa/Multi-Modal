import { AlertTriangle, ArrowRight, Search, X } from 'lucide-react';
import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react';
import { useLogger } from '../context/LoggerContext';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onTypingError?: (hasError: boolean) => void;
  placeholder?: string;
}

// Simple typo detection for common medical terms
const MEDICAL_TERMS = [
  'paracetamol', 'ibuprofen', 'amoxicillin', 'vitamin', 'aspirin',
  'omeprazole', 'metformin', 'cetirizine', 'loratadine', 'dexamethasone',
  'antasida', 'antibiotik', 'analgesik', 'antihistamin', 'antiseptik',
  'obat flu', 'obat batuk', 'obat demam', 'obat alergi', 'obat maag'
];

function SearchBar({ onSearch, onTypingError, placeholder = 'Cari obat...' }: SearchBarProps) {
  const { logger } = useLogger();
  const [query, setQuery] = useState('');
  const [hasTypo, setHasTypo] = useState(false);
  const [searchSessionId, setSearchSessionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyTimeRef = useRef<number>(0);

  // Start search session when input is focused
  const handleFocus = () => {
    if (!searchSessionId) {
      const sessionId = logger.startSearchSession('search-input');
      setSearchSessionId(sessionId);
    }
  };

  // End search session when input loses focus
  const handleBlur = () => {
    if (searchSessionId && query.length === 0) {
      logger.endSearchSession(searchSessionId);
      setSearchSessionId(null);
    }
  };

  // Handle input change (content-blind - only track metadata)
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    // Check for potential typos (simple heuristic)
    checkForTypos(newValue);
  };

  // Handle keydown for cognitive load tracking
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const now = performance.now();
    const keyCategory = categorizeKey(e.key, e.code);
    const isCorrection = e.code === 'Backspace' || e.code === 'Delete';
    
    // Record keystroke for cognitive load analysis
    if (searchSessionId) {
      logger.recordSearchKeystroke(
        e.code,
        keyCategory,
        isCorrection,
        query.length
      );
    }
    
    lastKeyTimeRef.current = now;
    
    // Handle Enter to submit search
    if (e.key === 'Enter' && query.trim()) {
      handleSubmitSearch();
    }
  };

  // Categorize key (privacy - content-blind)
  const categorizeKey = (key: string, code: string): string => {
    if (key.length > 1) {
      if (['Backspace', 'Delete', 'Tab', 'Enter', 'Escape'].includes(key)) return 'control';
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return 'arrow';
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) return 'modifier';
      return 'special';
    }
    if (code.startsWith('Key')) return 'letter';
    if (code.startsWith('Digit')) return 'digit';
    return 'other';
  };

  // Simple typo detection for visual feedback
  const checkForTypos = (text: string) => {
    if (text.length < 3) {
      setHasTypo(false);
      onTypingError?.(false);
      return;
    }

    const lowerText = text.toLowerCase();
    
    // Check if it's a partial match of any medical term
    const isPartialMatch = MEDICAL_TERMS.some(term => 
      term.startsWith(lowerText) || lowerText.startsWith(term.substring(0, Math.min(text.length, term.length)))
    );
    
    // Check for common typo patterns (repeated characters, unlikely combinations)
    const hasRepeatedChars = /(.)\1{2,}/.test(text);
    const hasUnlikelyCombination = /[qwxz]{2,}|[^aeiou]{5,}/i.test(text);
    
    const potentialTypo = !isPartialMatch && (hasRepeatedChars || hasUnlikelyCombination);
    
    setHasTypo(potentialTypo);
    onTypingError?.(potentialTypo);
  };

  // Submit search and end session
  const handleSubmitSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      
      // End search session
      if (searchSessionId) {
        const searchLog = logger.endSearchSession(searchSessionId);
        console.log('[SearchBar] Search completed:', searchLog);
        setSearchSessionId(null);
      }
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setHasTypo(false);
    onTypingError?.(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className={`flex items-center bg-white rounded-xl shadow-md border-2 transition-all duration-200 ${
        hasTypo ? 'border-red-400 shadow-red-100' : 'border-transparent focus-within:border-teal-400'
      }`}>
        {/* Search Icon */}
        <div className="pl-4 pr-2">
          <Search 
            className={`w-5 h-5 transition-colors ${hasTypo ? 'text-red-400' : 'text-teal-500'}`}
          />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          id="search-input"
          name="search-input"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          // Disable autocomplete and autocorrect for manual typing
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          className={`flex-1 py-4 pr-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 ${
            hasTypo ? 'underline decoration-red-400 decoration-wavy' : ''
          }`}
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="pr-4 text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Search Button */}
        <button
          type="button"
          onClick={handleSubmitSearch}
          disabled={!query.trim()}
          className="px-4 py-2 mr-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-500 hover:to-emerald-500 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Typo Warning */}
      {hasTypo && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-4 h-4" />
          Periksa ejaan Anda
        </p>
      )}

      {/* Recording Indicator */}
      {searchSessionId && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Recording</span>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
