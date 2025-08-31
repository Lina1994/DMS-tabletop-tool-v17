
import React, { useState, useRef, useEffect } from 'react';
import './MultiSelectFilter.css';

function MultiSelectFilter({ options, selectedValues, onChange, placeholder = 'Todos' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (value) => {
    if (value === 'all') {
      if (selectedValues.length === options.length) {
        onChange([]);
      } else {
        onChange(options.map(o => o.value));
      }
    } else {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(newSelectedValues);
    }
  };

  const isAllSelected = selectedValues.length === options.length;

  const getDisplayValue = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    } else if (selectedValues.length === options.length) {
      return `Todos seleccionados`;
    } else if (selectedValues.length <= 2) {
        return selectedValues.map(val => options.find(o => o.value === val)?.label || val).join(', ');
    } else {
      return `${selectedValues.length} seleccionados`;
    }
  };

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <button type="button" className="dropdown-toggle" onClick={handleToggle}>
        {getDisplayValue()}
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <label key="all" className="dropdown-item">
            <input
              type="checkbox"
              value="all"
              checked={isAllSelected}
              onChange={() => handleCheckboxChange('all')}
            />
            Todos
          </label>
          {options.map((option) => (
            <label key={option.value} className="dropdown-item">
              <input
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={() => handleCheckboxChange(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectFilter;
