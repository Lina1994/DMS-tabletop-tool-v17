import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { NavLink } from 'react-router-dom';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { useDate } from '../../contexts/DateContext'; // Import useDate
import Logo from '../../Images/Logo.png';
import './Sidebar.css';
import API_BASE_URL from '../../apiConfig';

const CampaignLogo = () => {
  const { currentCampaign } = useCampaign();

  if (currentCampaign) {
    if (currentCampaign.image_data) {
      return <img src={currentCampaign.image_data} alt={currentCampaign.name} className="campaign-sidebar-logo-image" />;
    }
    return <div className="campaign-sidebar-logo-text">{currentCampaign.name}</div>;
  }

  return <img src={Logo} alt="Database Logo" />;
};

function Sidebar({ isCollapsed, toggleSidebar }) {
  const { currentSong, isPlaying, togglePlayPause, setVolume } = useAudioPlayer();
  const [showVolume, setShowVolume] = useState(false);
  const { sidebarItems } = useSidebar();
  const { selectedDay, setSelectedDay } = useDate(); // Use selectedDay and setSelectedDay from DateContext
  const { currentCampaign } = useCampaign(); // Get currentCampaign for calendar settings

  const [calendarSettings, setCalendarSettings] = useState(null); // Local state for calendar settings

  // Fetch calendar settings when currentCampaign changes
  useEffect(() => {
    const fetchCalendarSettings = async () => {
      if (!currentCampaign) {
        setCalendarSettings(null);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/calendars/${currentCampaign.id}`);
        if (!response.ok) {
          throw new Error(`Error fetching calendar: ${response.statusText}`);
        }
        const data = await response.json();
        setCalendarSettings(data);
        // If selectedDay is null, initialize it with the first day of the current year from calendar settings
        if (!selectedDay && data) {
          setSelectedDay({ monthIndex: 0, day: 1, year: data.current_year });
        }
      } catch (err) {
        console.error("Error fetching calendar settings in Sidebar:", err);
        setCalendarSettings(null);
      }
    };
    fetchCalendarSettings();
  }, [currentCampaign, selectedDay, setSelectedDay]);


  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
  };

  const handlePreviousDay = useCallback(() => {
    if (!selectedDay || !calendarSettings) return;

    let newDay = selectedDay.day - 1;
    let newMonthIndex = selectedDay.monthIndex;
    let newYear = selectedDay.year;

    if (newDay < 1) {
      newMonthIndex -= 1;
      if (newMonthIndex < 0) {
        newMonthIndex = calendarSettings.num_months - 1;
        const yearParts = newYear.split(' ');
        let yearNumber = parseInt(yearParts[0], 10);
        if (!isNaN(yearNumber)) {
          yearNumber -= 1;
          newYear = `${yearNumber} ${yearParts.slice(1).join(' ')}`;
        } else {
          console.warn("Cannot decrement non-numeric year:", newYear);
          return;
        }
      }
      newDay = calendarSettings.days_in_month[newMonthIndex];
    }
    setSelectedDay({ monthIndex: newMonthIndex, day: newDay, year: newYear });
  }, [selectedDay, calendarSettings, setSelectedDay]);

  const handleNextDay = useCallback(() => {
    if (!selectedDay || !calendarSettings) return;

    let newDay = selectedDay.day + 1;
    let newMonthIndex = selectedDay.monthIndex;
    let newYear = selectedDay.year;

    if (newDay > calendarSettings.days_in_month[newMonthIndex]) {
      newDay = 1;
      newMonthIndex += 1;
      if (newMonthIndex >= calendarSettings.num_months) {
        newMonthIndex = 0;
        const yearParts = newYear.split(' ');
        let yearNumber = parseInt(yearParts[0], 10);
        if (!isNaN(yearNumber)) {
          yearNumber += 1;
          newYear = `${yearNumber} ${yearParts.slice(1).join(' ')}`;
        } else {
          console.warn("Cannot increment non-numeric year:", newYear);
          return;
        }
      }
    }
    setSelectedDay({ monthIndex: newMonthIndex, day: newDay, year: newYear });
  }, [selectedDay, calendarSettings, setSelectedDay]);

  // Format the date for display
  const formattedDate = selectedDay && calendarSettings
    ? `${selectedDay.day}/${calendarSettings.month_names[selectedDay.monthIndex]}`
    : 'N/A';

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <NavLink to="/database" className="database-logo-link">
        <div className="database-logo">
          <CampaignLogo />
        </div>
      </NavLink>
      <ul className="sidebar-nav">
        {sidebarItems.filter(item => item.isVisible).map(item => {
          console.log(`Sidebar: Rendering NavLink for ${item.name} with path: ${item.path}`);
          return (
            <li key={item.id}>
              <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                <div dangerouslySetInnerHTML={{ __html: item.icon }} />
                <span className="link-text">{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      <div className="sidebar-footer">
        {/* Date Display and Navigation */}
        {selectedDay && calendarSettings && (
          <div className="date-navigation-controls">
            <button onClick={handlePreviousDay} className="date-nav-button">&lt;</button>
            <span className="current-date">{formattedDate}</span>
            <button onClick={handleNextDay} className="date-nav-button">&gt;</button>
          </div>
        )}

        {currentSong && (
          <div className="audio-player-controls">
            <div className="song-title-wrapper">
              <p className="song-title-text">Reproduciendo: {currentSong.name} - {currentSong.group}</p>
            </div>
            <div className="custom-audio-controls">
              <button className="play-pause-button" onClick={togglePlayPause}>
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-pause"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                )}
              </button>
              <div className={`volume-control ${showVolume ? 'show-slider' : ''}`} onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
                <button className="volume-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>
                <input type="range" min="0" max="1" step="0.01" defaultValue="1" onChange={handleVolumeChange} className="volume-slider" />
              </div>
            </div>
          </div>
        )}
        <button className="sidebar-toggle-button" onClick={toggleSidebar}>
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevrons-right"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevrons-left"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;