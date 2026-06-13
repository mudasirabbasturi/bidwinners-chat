// components/DropdownSelect/DropdownSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MdSearch, MdKeyboardArrowDown, MdCheck, MdClose } from 'react-icons/md';
import './DropdownSelect.css';

const DropdownSelect = ({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    searchable = true,
    allowClear = true,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const optionsRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [searchTerm]);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                break;
            default:
                break;
        }
    };

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
        setSearchTerm('');
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm('');
        }
    };

    // Scroll highlighted option into view
    useEffect(() => {
        if (highlightedIndex >= 0 && optionsRef.current) {
            const highlightedElement = optionsRef.current.children[highlightedIndex];
            if (highlightedElement) {
                highlightedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [highlightedIndex]);

    return (
        <div
            className={`dropdown-select ${isOpen ? 'open' : ''} ${className}`}
            ref={dropdownRef}
        >
            <div
                className="dropdown-select-trigger"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`dropdown-select-value ${!selectedOption ? 'placeholder' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="dropdown-select-actions">
                    {allowClear && selectedOption && (
                        <span
                            className="dropdown-select-clear"
                            onClick={handleClear}
                            role="button"
                            aria-label="Clear selection"
                        >
                            <MdClose size={16} />
                        </span>
                    )}
                    <MdKeyboardArrowDown className={`dropdown-select-arrow ${isOpen ? 'rotated' : ''}`} size={20} />
                </div>
            </div>

            {isOpen && (
                <div className="dropdown-select-menu">
                    {searchable && (
                        <div className="dropdown-select-search">
                            <MdSearch className="dropdown-search-icon" size={16} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="dropdown-search-input"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    <div className="dropdown-select-options" ref={optionsRef}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <div
                                    key={option.value}
                                    className={`dropdown-select-option ${option.value === value ? 'selected' : ''
                                        } ${index === highlightedIndex ? 'highlighted' : ''}`}
                                    onClick={() => handleSelect(option.value)}
                                    role="option"
                                    aria-selected={option.value === value}
                                >
                                    {option.icon && (
                                        <span className={`option-icon ${option.statusClass || ''}`}>
                                            {option.icon}
                                        </span>
                                    )}
                                    <span className="option-label">{option.label}</span>
                                    {option.count !== undefined && (
                                        <span className="option-count">{option.count}</span>
                                    )}
                                    {option.value === value && (
                                        <MdCheck className="option-check" size={18} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="dropdown-select-empty">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownSelect;