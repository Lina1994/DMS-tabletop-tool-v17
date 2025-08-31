import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import './Database.css';

function Database({ theme, toggleTheme }) {
  const { sidebarItems, toggleItemVisibility } = useSidebar();
  const [showSidebarConfig, setShowSidebarConfig] = useState(false);

  const handleEditClick = () => {
    setShowSidebarConfig(!showSidebarConfig);
  };

  return (
    <div className="database-container">
      <div className="database-header">
        <h2>1d20 Toolbox</h2>
        <button className="theme-toggle-button" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-sun">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-moon">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>
      <div className="database-nav-horizontal">
        <NavLink to="/database/maps" className={({ isActive }) => isActive ? 'active' : ''}>Maps</NavLink>
        <NavLink to="/database/bestiary" className={({ isActive }) => isActive ? 'active' : ''}>Bestiary</NavLink>
        <NavLink to="/database/shops" className={({ isActive }) => isActive ? 'active' : ''}>Shops</NavLink>
        <NavLink to="/database/soundtrack" className={({ isActive }) => isActive ? 'active' : ''}>Soundtrack</NavLink>
        <NavLink to="/database/campaign" className={({ isActive }) => isActive ? 'active' : ''}>Campaign</NavLink>
        <NavLink to="/database/journal" className={({ isActive }) => isActive ? 'active' : ''}>Journal</NavLink>
        <NavLink to="/database/encounters" className={({ isActive }) => isActive ? 'active' : ''}>Encounters</NavLink>
        <NavLink to="/database/combat" className={({ isActive }) => isActive ? 'active' : ''}>Combat</NavLink>
        <NavLink to="/database/characters" className={({ isActive }) => isActive ? 'active' : ''}>Characters</NavLink>
        <NavLink to="/database/spells" className={({ isActive }) => isActive ? 'active' : ''}>Spells</NavLink>
        <button className="edit-sidebar-button" onClick={handleEditClick}>
          {showSidebarConfig ? 'Done' : 'Edit Sidebar'}
        </button>
      </div>

      {showSidebarConfig && (
        <div className="sidebar-configuration">
          <h3>Sidebar Configuration</h3>
          {sidebarItems.map(item => (
            <div key={item.id} className="sidebar-item-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={item.isVisible}
                  onChange={() => toggleItemVisibility(item.id)}
                />
                {item.name}
              </label>
            </div>
          ))}
        </div>
      )}

      <Outlet />
    </div>
  );
}

export default Database;