import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'; // Import useEffect

const DateContext = createContext(null);

export const useDate = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};

export const DateProvider = ({ children }) => {
  // Function to get initial selectedDay from localStorage
  const getInitialSelectedDay = () => {
    try {
      const storedDay = localStorage.getItem('selectedCalendarDay');
      if (storedDay) {
        return JSON.parse(storedDay);
      }
    } catch (error) {
      console.error("Error parsing stored selected day from localStorage:", error);
    }
    // Default initial value if nothing in localStorage or error
    // This should ideally be set based on the current campaign's calendar settings
    // For now, a generic default or null, and let Calendar component initialize it if null
    return null;
  };

  const [selectedDay, setSelectedDayState] = useState(getInitialSelectedDay);

  const setSelectedDay = useCallback((day) => {
    setSelectedDayState(day);
  }, []);

  // Effect to save selectedDay to localStorage whenever it changes
  useEffect(() => {
    try {
      if (selectedDay) {
        localStorage.setItem('selectedCalendarDay', JSON.stringify(selectedDay));
      } else {
        localStorage.removeItem('selectedCalendarDay'); // Remove if selectedDay becomes null
      }
    } catch (error) {
      console.error("Error saving selected day to localStorage:", error);
    }
  }, [selectedDay]);

  return (
    <DateContext.Provider value={{ selectedDay, setSelectedDay }}>
      {children}
    </DateContext.Provider>
  );
};