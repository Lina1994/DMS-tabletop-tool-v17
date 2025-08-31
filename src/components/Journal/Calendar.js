import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import { useDate } from '../../contexts/DateContext'; // Import useDate
import { v4 as uuidv4 } from 'uuid';
import './Calendar.css';

import API_BASE_URL from '../../apiConfig';

function Calendar() {
    const { currentCampaign } = useCampaign();
    const { selectedDay, setSelectedDay } = useDate(); // Use selectedDay and setSelectedDay from DateContext
    const [calendarSettings, setCalendarSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false); // New state for settings visibility
    const calendarDisplayRef = useRef(null); // Ref for the calendar-display div
    const [calculatedMinDayWidth, setCalculatedMinDayWidth] = useState(60); // State to store dynamically calculated minDayWidth

    // State for Diary Entry (these remain local to Calendar)
    const [diaryEntryContent, setDiaryEntryContent] = useState('');
    const [diaryEntryId, setDiaryEntryId] = useState(null);
    const [diaryLoading, setDiaryLoading] = useState(false);
    const [diaryError, setDiaryError] = useState(null);
    const [diaryEntries, setDiaryEntries] = useState([]); // New state to store all diary entries for the year

    // New state for calendar collapse/expand
    const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true); // Default to collapsed

    // New state for Master Notes
    const [masterNotesContent, setMasterNotesContent] = useState('');

    const defaultMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const defaultDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const defaultWeekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const createDefaultCalendar = useCallback(async () => {
        if (!currentCampaign) return;

        const newCalendar = {
            id: uuidv4(),
            campaign_id: currentCampaign.id,
            num_months: 12,
            month_names: defaultMonthNames,
            days_in_month: defaultDaysInMonth,
            days_in_week: 7,
            weekday_names: defaultWeekdayNames,
            current_year: "1 DR", // Default year
        };

        setLoading(true);
        setError(null);
        try {
            const addResponse = await fetch(`${API_BASE_URL}/calendars`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCalendar),
            });
            if (!addResponse.ok) {
                throw new Error('Failed to create default calendar');
            }
            setCalendarSettings(newCalendar);
            setShowSettings(true); // Show settings after creating default
        } catch (err) {
            console.error("Error creating default calendar:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentCampaign, defaultMonthNames, defaultDaysInMonth, defaultWeekdayNames]);

    const fetchCalendarSettings = useCallback(async () => {
        if (!currentCampaign) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/calendars/${currentCampaign.id}`);
            if (!response.ok) {
                throw new Error(`Error fetching calendar: ${response.statusText}`);
            }
            const data = await response.json();
            if (data) {
                setCalendarSettings(data);
                // Initialize selectedDay in context if it's null and calendar settings are fetched
                if (!selectedDay) {
                    setSelectedDay({ monthIndex: 0, day: 1, year: data.current_year });
                }
            } else {
                setCalendarSettings(null); // Ensure it's null if no data
            }
        } catch (err) {
            console.error("Error fetching calendar:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentCampaign, selectedDay, setSelectedDay]); // Added selectedDay, setSelectedDay to dependencies

    const fetchAllDiaryEntries = useCallback(async () => {
        console.log('Calendar.js: fetchAllDiaryEntries function called.');
        if (!currentCampaign || !calendarSettings) {
            console.log('Calendar.js: fetchAllDiaryEntries - Skipping fetch due to missing currentCampaign or calendarSettings.');
            setDiaryEntries([]);
            return;
        }
        console.log(`Calendar.js: Attempting to fetch diary entries for campaign ${currentCampaign.id} and year ${calendarSettings.current_year}`);
        try {
            const response = await fetch(`${API_BASE_URL}/diary/campaign/${currentCampaign.id}/year/${calendarSettings.current_year}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('Calendar.js: No diary entries found (404).');
                    setDiaryEntries([]);
                    return;
                }
                throw new Error(`Error fetching all diary entries: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Calendar.js: Successfully fetched diary entries:', data);
            setDiaryEntries(data || []);
        } catch (err) {
            console.error("Calendar.js: Error fetching all diary entries:", err);
            setDiaryEntries([]);
        }
    }, [currentCampaign, calendarSettings]);

    useEffect(() => {
        fetchCalendarSettings();
    }, [fetchCalendarSettings]);

    useEffect(() => {
        console.log('Calendar.js: useEffect for fetchAllDiaryEntries triggered.');
        console.log('Calendar.js: currentCampaign:', currentCampaign);
        console.log('Calendar.js: calendarSettings:', calendarSettings);
        fetchAllDiaryEntries();
    }, [fetchAllDiaryEntries, currentCampaign, calendarSettings]); // Added dependencies for clarity

    // Removed useEffect for localStorage as selectedDay is now managed by DateContext

    // Effect to load master notes when currentCampaign changes
    useEffect(() => {
        if (currentCampaign && currentCampaign.notes !== undefined) {
            setMasterNotesContent(currentCampaign.notes || '');
        } else {
            setMasterNotesContent('');
        }
    }, [currentCampaign]);

    // Effect to calculate and set --min-month-width CSS variable and dynamic minDayWidth
    useEffect(() => {
        if (calendarSettings && calendarDisplayRef.current) {
            // Dynamically calculate minDayWidth based on longest weekday name
            let maxWeekdayNameWidth = 0;
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.whiteSpace = 'nowrap';
            // Apply styles that affect width from .weekday-name and .calendar-day
            tempDiv.style.padding = '5px'; // from .weekday-name
            tempDiv.style.fontSize = '1em'; // Assuming default font size
            tempDiv.style.fontWeight = 'bold'; // from .calendar-weekdays
            document.body.appendChild(tempDiv);

            calendarSettings.weekday_names.forEach(name => {
                tempDiv.textContent = name;
                maxWeekdayNameWidth = Math.max(maxWeekdayNameWidth, tempDiv.offsetWidth);
            });
            document.body.removeChild(tempDiv);

            // Add some buffer for padding/border of the actual day cells
            const calculatedMinDayWidthValue = maxWeekdayNameWidth + (10 * 2); // 10px padding on each side of .calendar-day
            setCalculatedMinDayWidth(calculatedMinDayWidthValue);

            const gapBetweenDays = 5; // From .calendar-weekdays and .calendar-days-grid gap
            const monthPadding = 30; // 15px left + 15px right from .calendar-month padding

            const calculatedMinMonthWidth =
                (calendarSettings.days_in_week * calculatedMinDayWidthValue) +
                ((calendarSettings.days_in_week - 1) * gapBetweenDays) +
                monthPadding;

            calendarDisplayRef.current.style.setProperty('--min-month-width', `${calculatedMinMonthWidth}px`);
        }
    }, [calendarSettings]); // Recalculate when calendarSettings changes

    const handleSettingChange = async (e) => {
        const { name, value } = e.target;
        let updatedValue = value;
        let newCalendarSettings = { ...calendarSettings };

        if (name === "num_months" || name === "days_in_week") {
            updatedValue = parseInt(value, 10);
            if (isNaN(updatedValue)) return;

            if (name === "days_in_week") {
                // Adjust weekday names array size if days_in_week changes
                const currentWeekdayNames = newCalendarSettings.weekday_names;
                const newWeekdayNames = Array(updatedValue).fill('').map((_, i) => currentWeekdayNames[i] || defaultWeekdayNames[i] || `Day ${i + 1}`);
                newCalendarSettings = { ...newCalendarSettings, weekday_names: newWeekdayNames };
            }
            else if (name === "num_months") {
                // Adjust month names and days in month array sizes if num_months changes
                const currentMonthNames = newCalendarSettings.month_names;
                const newMonthNames = Array(updatedValue).fill('').map((_, i) => currentMonthNames[i] || defaultMonthNames[i] || `Month ${i + 1}`);
                const currentDaysInMonth = newCalendarSettings.days_in_month;
                const newDaysInMonth = Array(updatedValue).fill('').map((_, i) => currentDaysInMonth[i] || defaultDaysInMonth[i] || 30);
                newCalendarSettings = { ...newCalendarSettings, month_names: newMonthNames, days_in_month: newDaysInMonth };
            }
        } else if (name === "current_year") { // Handle year change
            updatedValue = value;
        }

        newCalendarSettings = {
            ...newCalendarSettings,
            [name]: updatedValue,
        };

        setCalendarSettings(newCalendarSettings); // Optimistic update

        try {
            const response = await fetch(`${API_BASE_URL}/calendars/${newCalendarSettings.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCalendarSettings),
            });
            if (!response.ok) {
                throw new Error('Failed to update calendar settings');
            }
            // If current_year changed, re-fetch all diary entries
            if (name === "current_year") {
                fetchAllDiaryEntries();
            }
        } catch (err) {
            console.error("Error updating calendar settings:", err);
            setError(err.message);
            fetchCalendarSettings(); // Re-fetch to get actual state
        }
    };

    const handleArraySettingChange = async (arrayName, index, value) => {
        let newCalendarSettings = { ...calendarSettings };
        let updatedArray = [...newCalendarSettings[arrayName]];

        if (arrayName === "days_in_month") {
            updatedArray[index] = parseInt(value, 10);
            if (isNaN(updatedArray[index])) return; // Prevent updating with NaN
        } else {
            updatedArray[index] = value;
        }

        newCalendarSettings = {
            ...newCalendarSettings,
            [arrayName]: updatedArray,
        };

        setCalendarSettings(newCalendarSettings); // Optimistic update

        try {
            const response = await fetch(`${API_BASE_URL}/calendars/${newCalendarSettings.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCalendarSettings),
            });
            if (!response.ok) {
                throw new Error('Failed to update calendar settings');
            }
        } catch (err) {
            console.error("Error updating calendar settings:", err);
            setError(err.message);
            fetchCalendarSettings(); // Re-fetch to get actual state
        }
    };

    const fetchDiaryEntry = useCallback(async (campaignId, year, monthIndex, day) => {
        setDiaryLoading(true);
        setDiaryError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/diary/${campaignId}/${year}/${monthIndex}/${day}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setDiaryEntryContent('');
                    setDiaryEntryId(null);
                    return; // No entry found, not an error
                }
                throw new Error(`Error fetching diary entry: ${response.statusText}`);
            }
            const data = await response.json();
            if (data) {
                setDiaryEntryContent(data.content);
                setDiaryEntryId(data.id);
            } else {
                setDiaryEntryContent('');
                setDiaryEntryId(null);
            }
        } catch (err) {
            console.error("Error fetching diary entry:", err);
            setDiaryError(err.message);
            setDiaryEntryContent('');
            setDiaryEntryId(null);
        } finally {
            setDiaryLoading(false);
        }
    }, []);

    const saveDiaryEntry = useCallback(async () => {
        if (!currentCampaign || !selectedDay || !calendarSettings) return;

        setDiaryLoading(true);
        setDiaryError(null);

        const entryData = {
            campaign_id: currentCampaign.id,
            year: calendarSettings.current_year,
            month_index: selectedDay.monthIndex,
            day: selectedDay.day,
            content: diaryEntryContent,
        };

        try {
            let response;
            if (diaryEntryId) {
                // Update existing entry
                response = await fetch(`${API_BASE_URL}/diary/${diaryEntryId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: diaryEntryId, content: diaryEntryContent }),
                });
            } else {
                // Create new entry
                const newId = uuidv4();
                response = await fetch(`${API_BASE_URL}/diary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...entryData, id: newId }),
                });
                if (response.ok) {
                    setDiaryEntryId(newId);
                }
            }

            if (!response.ok) {
                throw new Error('Failed to save diary entry');
            }
            // After saving, re-fetch all diary entries to update the calendar display
            fetchAllDiaryEntries();
        } catch (err) {
            console.error("Error saving diary entry:", err);
            setDiaryError(err.message);
        } finally {
            setDiaryLoading(false);
        }
    }, [currentCampaign, selectedDay, calendarSettings, diaryEntryContent, diaryEntryId, fetchAllDiaryEntries]);

    const deleteDiaryEntry = useCallback(async () => {
        if (!diaryEntryId || !window.confirm('Are you sure you want to delete this diary entry?')) return;

        setDiaryLoading(true);
        setDiaryError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/diary/${diaryEntryId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete diary entry');
            }
            setDiaryEntryContent('');
            setDiaryEntryId(null);
            // After deleting, re-fetch all diary entries to update the calendar display
            fetchAllDiaryEntries();
        } catch (err) {
            console.error("Error deleting diary entry:", err);
            setDiaryError(err.message);
        } finally {
            setDiaryLoading(false);
        }
    }, [diaryEntryId, fetchAllDiaryEntries]);

    // Effect to fetch diary entry when selectedDay or campaign changes
    useEffect(() => {
        if (currentCampaign && selectedDay && calendarSettings) {
            fetchDiaryEntry(currentCampaign.id, calendarSettings.current_year, selectedDay.monthIndex, selectedDay.day);
        } else {
            setDiaryEntryContent('');
            setDiaryEntryId(null);
        }
    }, [currentCampaign, selectedDay, calendarSettings, fetchDiaryEntry]);

    const goToPreviousDay = useCallback(() => {
        if (!selectedDay || !calendarSettings) return;

        let newDay = selectedDay.day - 1;
        let newMonthIndex = selectedDay.monthIndex;
        let newYear = selectedDay.year;

        // Handle going back to previous month
        if (newDay < 1) {
            newMonthIndex -= 1;
            // Handle going back to previous year
            if (newMonthIndex < 0) {
                newMonthIndex = calendarSettings.num_months - 1; // Last month of the year
                // Assuming year is a string like "1 DR", we need to parse and decrement
                const yearParts = newYear.split(' ');
                let yearNumber = parseInt(yearParts[0], 10);
                if (!isNaN(yearNumber)) {
                    yearNumber -= 1;
                    newYear = `${yearNumber} ${yearParts.slice(1).join(' ')}`;
                } else {
                    // Handle cases where year is not a number (e.g., just "DR")
                    // For now, we'll just stop decrementing the year if it's not a number.
                    // Or, you might want to implement more complex year logic.
                    console.warn("Cannot decrement non-numeric year:", newYear);
                    return; // Stop if year cannot be decremented
                }
            }
            newDay = calendarSettings.days_in_month[newMonthIndex]; // Last day of previous month
        }
        setSelectedDay({ monthIndex: newMonthIndex, day: newDay, year: newYear });
    }, [selectedDay, calendarSettings, setSelectedDay]); // Added setSelectedDay to dependencies

    const goToNextDay = useCallback(() => {
        if (!selectedDay || !calendarSettings) return;

        let newDay = selectedDay.day + 1;
        let newMonthIndex = selectedDay.monthIndex;
        let newYear = selectedDay.year;

        // Handle going to next month
        if (newDay > calendarSettings.days_in_month[newMonthIndex]) {
            newDay = 1;
            newMonthIndex += 1;
            // Handle going to next year
            if (newMonthIndex >= calendarSettings.num_months) {
                newMonthIndex = 0; // First month of the year
                // Assuming year is a string like "1 DR", we need to parse and increment
                const yearParts = newYear.split(' ');
                let yearNumber = parseInt(yearParts[0], 10);
                if (!isNaN(yearNumber)) {
                    yearNumber += 1;
                    newYear = `${yearNumber} ${yearParts.slice(1).join(' ')}`;
                } else {
                    // Handle cases where year is not a number
                    console.warn("Cannot increment non-numeric year:", newYear);
                    return; // Stop if year cannot be incremented
                }
            }
        }
        setSelectedDay({ monthIndex: newMonthIndex, day: newDay, year: newYear });
    }, [selectedDay, calendarSettings, setSelectedDay]); // Added setSelectedDay to dependencies

    // Save Master Notes function
    const saveMasterNotes = useCallback(async () => {
        if (!currentCampaign) return;

        try {
            const updatedCampaign = {
                ...currentCampaign,
                notes: masterNotesContent,
            };

            const response = await fetch(`${API_BASE_URL}/campaigns/${currentCampaign.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCampaign),
            });

            if (!response.ok) {
                throw new Error('Failed to save master notes');
            }
            console.log('Master notes saved successfully!');
            // Optionally, re-fetch campaigns to update the context if other components rely on it
            // useCampaign().fetchCampaigns(); // This would require fetchCampaigns to be exposed by useCampaign
        } catch (err) {
            console.error('Error saving master notes:', err);
            // Handle error, e.g., show a message to the user
        }
    }, [currentCampaign, masterNotesContent]);

    const renderCalendar = () => {
        if (!calendarSettings) return <p>No calendar data available.</p>;

        const { num_months, month_names, days_in_month, days_in_week, weekday_names, current_year } = calendarSettings;

        const calendarDisplay = [];
        let initialDayOfWeekForRendering = 0; // This will be the starting day of the week for the first month rendered

        let monthsToRender = [];
        if (isCalendarCollapsed) {
            if (selectedDay) {
                monthsToRender.push(selectedDay.monthIndex);
                // Calculate initialDayOfWeekForRendering for the selected month
                let daysBeforeSelectedMonth = 0;
                for (let i = 0; i < selectedDay.monthIndex; i++) {
                    daysBeforeSelectedMonth += days_in_month[i];
                }
                initialDayOfWeekForRendering = daysBeforeSelectedMonth % days_in_week;
            } else {
                // If collapsed and no day selected, show the first month
                monthsToRender.push(0);
                initialDayOfWeekForRendering = 0; // Assume first month starts on first weekday
            }
        }
        else {
            for (let i = 0; i < num_months; i++) {
                monthsToRender.push(i);
            }
            initialDayOfWeekForRendering = 0; // Full calendar view always starts with the first month on the first weekday
        }

        let currentDayOfWeek = initialDayOfWeekForRendering; // This will track the day of the week for the *current* month being rendered

        for (const monthIndex of monthsToRender) {
            const monthName = month_names[monthIndex] || `Month ${monthIndex + 1}`;
            const days = days_in_month[monthIndex] || 30;

            const monthDays = [];

            // Add empty cells for the beginning of the month
            for (let j = 0; j < currentDayOfWeek; j++) {
                monthDays.push(<div key={`empty-${monthIndex}-${j}`} className="calendar-day empty"></div>);
            }

            for (let day = 1; day <= days; day++) {
                const isSelected = selectedDay && selectedDay.monthIndex === monthIndex && selectedDay.day === day && selectedDay.year === current_year;
                const dayEntries = diaryEntries.filter(entry =>
                    entry.month_index === monthIndex &&
                    entry.day === day &&
                    entry.year === current_year
                );
                const hasEntry = dayEntries.some(entry => entry.content && entry.content.trim() !== '');

                console.log(`Day: ${day}, Month: ${monthName}, Year: ${current_year}, Entries:`, dayEntries);

                const diarySnippet = hasEntry && dayEntries[0] && dayEntries[0].content
                    ? dayEntries[0].content.substring(0, 50) + (dayEntries[0].content.length > 50 ? '...' : '')
                    : '';

                monthDays.push(
                    <div
                        key={`day-${monthIndex}-${day}`}
                        className={`calendar-day ${isSelected ? 'selected' : ''} ${hasEntry ? 'has-entry' : ''}`}
                        onClick={() => setSelectedDay({ monthIndex: monthIndex, day: day, year: current_year })}
                    >
                        {day}
                        {hasEntry && diarySnippet && (
                            <div className="diary-preview-box">
                                {diarySnippet}
                            </div>
                        )}
                    </div>
                );
            }

            // Update currentDayOfWeek for the *next* month in the sequence being rendered
            currentDayOfWeek = (currentDayOfWeek + days) % days_in_week;

            calendarDisplay.push(
                <div key={monthIndex} className="calendar-month">
                    <h3>{monthName}</h3>
                    <div className="calendar-weekdays" style={{ gridTemplateColumns: `repeat(${days_in_week}, minmax(${calculatedMinDayWidth}px, 1fr))` }}>
                        {weekday_names.map((name, index) => (
                            <div key={index} className="weekday-name">{name}</div>
                        ))}
                    </div>
                    <div className="calendar-days-grid" style={{ gridTemplateColumns: `repeat(${days_in_week}, minmax(${calculatedMinDayWidth}px, 1fr))` }}>
                        {monthDays}
                    </div>
                </div>
            );
        }
        return calendarDisplay;
    };

    if (loading) return <p>Loading calendar...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!currentCampaign) return <p>Please select a campaign to view the calendar.</p>;

    if (!calendarSettings && !loading) {
        return (
            <div className="calendar-container">
                <h2>Campaign Calendar for {currentCampaign.name}</h2>
                <p>No calendar found for this campaign. Would you like to create a default one?</p>
                <button onClick={createDefaultCalendar}>Create Default Calendar</button>
            </div>
        );
    }

    const selectedMonthName = selectedDay && calendarSettings ? calendarSettings.month_names[selectedDay.monthIndex] : '';
    // Calculate the weekday name for the selected day
    let selectedWeekdayName = '';
    if (selectedDay && calendarSettings) {
        // To calculate the weekday, we need to know the starting day of the week for the first day of the first month.
        // For simplicity, let's assume the first day of the first month (Month 1, Day 1) is always the first weekday (index 0).
        // Then, we can calculate the total number of days passed since the beginning of the year up to the selected day.
        let totalDaysPassed = 0;
        for (let i = 0; i < selectedDay.monthIndex; i++) {
            totalDaysPassed += calendarSettings.days_in_month[i];
        }
        totalDaysPassed += selectedDay.day - 1; // -1 because day is 1-indexed

        const weekdayIndex = totalDaysPassed % calendarSettings.days_in_week;
        selectedWeekdayName = calendarSettings.weekday_names[weekdayIndex];
    }

    return (
        <div className="calendar-container">
            <h2>Campaign Calendar for {currentCampaign.name} - Year {calendarSettings.current_year}</h2>

            <button onClick={() => setShowSettings(!showSettings)} className="edit-calendar-button">
                {showSettings ? 'Hide Settings' : 'Edit Calendar Settings'}
            </button>

            <button onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)} className="toggle-calendar-view-button">
                {isCalendarCollapsed ? 'Expand Calendar' : 'Collapse Calendar'}
            </button>

            {showSettings && (
                <div className="calendar-settings">
                    <h3>Calendar Settings</h3>
                    <label>
                        Number of Months:
                        <input
                            type="number"
                            name="num_months"
                            value={calendarSettings.num_months}
                            onChange={handleSettingChange}
                            min="1"
                        />
                    </label>
                    <div className="setting-group">
                        <h4>Month Names:</h4>
                        <div className="setting-input-grid">
                            {calendarSettings.month_names.map((name, index) => (
                                <label key={`month-name-${index}`}>
                                    Month {index + 1}:
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => handleArraySettingChange('month_names', index, e.target.value)}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="setting-group">
                        <h4>Days in Each Month:</h4>
                        <div className="setting-input-grid">
                            {calendarSettings.days_in_month.map((days, index) => (
                                <label key={`days-in-month-${index}`}>
                                    Month {index + 1} Days:
                                    <input
                                        type="number"
                                        value={days}
                                        onChange={(e) => handleArraySettingChange('days_in_month', index, e.target.value)}
                                        min="1"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                    <label>
                        Days in Week:
                        <input
                            type="number"
                            name="days_in_week"
                            value={calendarSettings.days_in_week}
                            onChange={handleSettingChange}
                            min="1"
                            max="7"
                        />
                    </label>
                    <div className="setting-group">
                        <h4>Weekday Names:</h4>
                        <div className="setting-input-grid">
                            {calendarSettings.weekday_names.map((name, index) => (
                                <label key={`weekday-name-${index}`}>
                                    Day {index + 1}:
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => handleArraySettingChange('weekday_names', index, e.target.value)}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                    <label>
                        Current Year:
                        <input
                            type="text"
                            name="current_year"
                            value={calendarSettings.current_year}
                            onChange={handleSettingChange}
                        />
                    </label>
                </div>
            )}

            <div ref={calendarDisplayRef} className="calendar-display">
                {renderCalendar()}
            </div>

            {selectedDay && calendarSettings && (
                <div className="diary-section">
                    <div className="diary-header">
                        <button onClick={goToPreviousDay} className="nav-button">&lt;</button>
                        <h3>Diary Entry for {selectedDay.day} {selectedMonthName}, {selectedDay.year} ({selectedWeekdayName})</h3>
                        <button onClick={goToNextDay} className="nav-button">&gt;</button>
                    </div>
                    {diaryLoading && <p>Loading diary entry...</p>}
                    {diaryError && <p className="error">Error: {diaryError}</p>}
                    <textarea
                        value={diaryEntryContent}
                        onChange={(e) => setDiaryEntryContent(e.target.value)}
                        placeholder="Write your diary entry here..."
                        rows="10"
                    ></textarea>
                    <div className="diary-actions">
                        <button onClick={saveDiaryEntry} disabled={diaryLoading}>Save Entry</button>
                        {diaryEntryId && (
                            <button onClick={deleteDiaryEntry} disabled={diaryLoading} className="delete-button">Delete Entry</button>
                        )}
                    </div>
                </div>
            )}

            <div className="master-notes-section">
                <h3>Master Notes</h3>
                <textarea
                    value={masterNotesContent}
                    onChange={(e) => setMasterNotesContent(e.target.value)}
                    placeholder="Write your master notes here..."
                    rows="10"
                ></textarea>
                <button onClick={saveMasterNotes}>Save Master Notes</button>
            </div>
        </div>
    );
}

export default Calendar;