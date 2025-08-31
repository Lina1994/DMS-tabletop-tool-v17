import React, { useState, useRef, useEffect } from 'react';
import './MultiSelect.css';

function MultiSelect({ options, selected, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    if (selected.find(item => item.id === option.id)) {
      onChange(selected.filter(item => item.id !== option.id));
    } else {
      onChange([...selected, option]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemove = (itemToRemove) => {
    onChange(selected.filter(item => item.id !== itemToRemove.id));
  };

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selected.find(item => item.id === option.id)
  );

  return (
    <div className="multi-select-container" ref={containerRef}>
      <div className="multi-select-input-container" onClick={() => setIsOpen(true)}>
        {selected.map(item => (
          <div key={item.id} className="selected-item-badge">
            {item.name}
            <button onClick={(e) => { e.stopPropagation(); handleRemove(item); }}>&times;</button>
          </div>
        ))}
        <input
          type="text"
          placeholder={placeholder || 'Buscar...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="multi-select-input"
        />
      </div>
      {isOpen && (
        <div className="dropdown-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.id}
                className="dropdown-list-item"
                onClick={() => handleSelect(option)}
              >
                {option.name}
              </div>
            ))
          ) : (
            <div className="dropdown-list-item">No hay más opciones</div>
          )}
        </div>
      )}
    </div>
  );
}

export default MultiSelect;
