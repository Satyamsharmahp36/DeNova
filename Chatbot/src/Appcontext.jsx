import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState(() => Cookies.get('userName') || null);
  const [main, setMain] = useState(true);
  const [presentUserData, setPresentUserData] = useState(null);
  const [presentUserName, setPresentUserName] = useState(() => Cookies.get('presentUserName') || null);
  const [per, setPer] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const fetchingUserRef = useRef(false);
  const fetchingPresentUserRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const lastFetchedUserRef = useRef(null);
  const lastFetchedPresentUserRef = useRef(null);

  // Helper function to refresh user data - MEMOIZED
  const refreshUserData = useCallback(async (force = false) => {
    if (!userName) return null;
    if (fetchingUserRef.current) return null;
    if (!force && lastFetchedUserRef.current === userName) return null;
    
    try {
      fetchingUserRef.current = true;
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${userName}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        lastFetchedUserRef.current = userName;
        return data;
      } else {
        console.error(`Failed to refresh user data: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    } finally {
      fetchingUserRef.current = false;
    }
  }, [userName]);

  // Helper function to refresh present user data - MEMOIZED
  const refreshPresentUserData = useCallback(async (force = false) => {
    if (!presentUserName) return null;
    if (fetchingPresentUserRef.current) return null;
    if (!force && lastFetchedPresentUserRef.current === presentUserName) return null;
    
    try {
      fetchingPresentUserRef.current = true;
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${presentUserName}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPresentUserData(data);
        lastFetchedPresentUserRef.current = presentUserName;
        return data;
      } else {
        console.error(`Failed to refresh present user data: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error refreshing present user data:", error);
      return null;
    } finally {
      fetchingPresentUserRef.current = false;
    }
  }, [presentUserName]);

  // Initial data fetch on mount ONLY
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    const initializeData = async () => {
      hasInitializedRef.current = true;
      
      try {
        const promises = [];
        if (userName) promises.push(refreshUserData());
        if (presentUserName) promises.push(refreshPresentUserData());
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing data:", error);
        setIsInitialized(true);
      }
    };

    initializeData();
  }, []);

  // Watch for userName changes - ONLY update cookie and fetch if changed AFTER initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    if (userName) {
      Cookies.set('userName', userName, { expires: 7 });
      // Only fetch if username actually changed
      if (lastFetchedUserRef.current !== userName) {
        refreshUserData();
      }
    } else {
      Cookies.remove('userName');
      setUserData(null);
      lastFetchedUserRef.current = null;
    }
  }, [userName, isInitialized]);

  // Watch for presentUserName changes - ONLY update cookie and fetch if changed AFTER initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    if (presentUserName) {
      Cookies.set('presentUserName', presentUserName, { expires: 7 });
      // Only fetch if presentUserName actually changed
      if (lastFetchedPresentUserRef.current !== presentUserName) {
        refreshPresentUserData();
      }
    } else {
      Cookies.remove('presentUserName');
      setPresentUserData(null);
      lastFetchedPresentUserRef.current = null;
    }
  }, [presentUserName, isInitialized]);

  return (
    <AppContext.Provider
      value={{
        userData,
        userName,
        setUserName, // Add setter for userName
        presentUserData,
        presentUserName,
        setPresentUserName, // Add setter for presentUserName
        refreshUserData,
        refreshPresentUserData,
        isInitialized
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};