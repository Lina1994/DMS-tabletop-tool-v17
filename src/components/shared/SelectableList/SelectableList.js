import React from 'react';
import './SelectableList.css';

function SelectableList({ options, selected, onChange }) {
  const handleToggle = (option) => {
    if (selected.find(item => item.id === option.id)) {
      onChange(selected.filter(item => item.id !== option.id));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="selectable-list-container">
      {options.length === 0 ? (
        <p>No hay opciones disponibles.</p>
      ) : (
        <ul className="selectable-list">
          {options.map(option => (
            <li
              key={option.id}
              className={`selectable-list-item ${selected.find(item => item.id === option.id) ? 'selected' : ''}`}
              onClick={() => handleToggle(option)}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SelectableList;
