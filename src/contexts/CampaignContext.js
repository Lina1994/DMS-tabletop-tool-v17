import React, { createContext, useState, useContext, useCallback } from 'react';

const CampaignContext = createContext();

export const useCampaign = () => useContext(CampaignContext);

import API_BASE_URL from '../apiConfig';

export const CampaignProvider = ({ children }) => {
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    }
  }, []);

  const value = {
    currentCampaign,
    setCurrentCampaign,
    campaigns,
    fetchCampaigns,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};