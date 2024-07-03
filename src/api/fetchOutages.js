// utils/fetchOutages.js

// Fetches MTA Elevator/Escalator Outages
export const fetchOutages = async (apiKey) => {
    try {
      const response = await fetch('https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene.json', {
        headers: {
          'x-api-key': apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching outage data:', error);
      return null;
    }
  };
  