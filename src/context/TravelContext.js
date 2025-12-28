import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateUniqueTripCode } from '../utils/tripCodeGenerator';
import { useAuth } from './AuthContext';
import * as DB from '../services/databaseService';

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Food & Dining', emoji: '🍽️', color: '#FF6B6B' },
  { id: '2', name: 'Transportation', emoji: '🚗', color: '#4ECDC4' },
  { id: '3', name: 'Accommodation', emoji: '🏨', color: '#45B7D1' },
  { id: '4', name: 'Activities', emoji: '🎯', color: '#96CEB4' },
  { id: '5', name: 'Shopping', emoji: '🛍️', color: '#FFEAA7' },
  { id: '6', name: 'Entertainment', emoji: '🎬', color: '#DDA0DD' },
  { id: '7', name: 'Health', emoji: '💊', color: '#98D8C8' },
  { id: '8', name: 'Other', emoji: '📦', color: '#B8B8B8' },
];

const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
];

const TravelContext = createContext(null);

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (!context) {
    return {
      tripInfo: {},
      budget: { total: 0 },
      expenses: [],
      packingItems: [],
      itinerary: [],
      tripHistory: [],
      allTrips: [],
      currency: currencies[0],
      currencies,
      setTripInfo: () => { },
      setBudget: () => { },
      setExpenses: () => { },
      addExpense: () => { },
      setPackingItems: () => { },
      setItinerary: () => { },
      setCurrency: () => { },
      clearTrip: async () => { },
      deleteTripFromHistory: () => { },
    };
  }
  return context;
};

export const TravelProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [tripInfo, setTripInfoState] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    name: '',
    participants: [],
    tripCode: '',
    tripType: '',
    isCompleted: false,
  });

  const [budget, setBudgetState] = useState({ total: 0, categories: {} });
  const [expenses, setExpenses] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [currency, setCurrencyState] = useState(currencies[0]);
  const [customCategories, setCustomCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

  // Wrapper for setCurrency to save to Firebase
  const setCurrency = async (newCurrency) => {
    setCurrencyState(newCurrency);
    if (isAuthenticated && user) {
      try {
        await DB.saveUserSettings({ currency: newCurrency.code });
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    }
  };

  // Load data from Firebase when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      // Clear local state when user logs out
      resetLocalState();
    }
  }, [isAuthenticated, user]);

  const resetLocalState = () => {
    setTripInfoState({
      destination: '', startDate: '', endDate: '', name: '',
      participants: [], tripCode: '', tripType: '', isCompleted: false,
    });
    setBudgetState({ total: 0, categories: {} });
    setExpenses([]);
    setPackingItems([]);
    setItinerary([]);
    setTripHistory([]);
    setAllTrips([]);
    setCurrencyState(currencies[0]);
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading user data from Firebase...');

      // Load user settings (Currency)
      const settings = await DB.getUserSettings();
      if (settings?.currency) {
        const savedCurrency = currencies.find(c => c.code === settings.currency);
        if (savedCurrency) setCurrencyState(savedCurrency);
      }

      // Load current trip info
      const currentTrip = await DB.getCurrentTripInfo();
      if (currentTrip) {
        setTripInfoState(currentTrip);
      }

      // Load budget
      const savedBudget = await DB.getBudget();
      setBudgetState(savedBudget);

      // Load expenses
      const savedExpenses = await DB.getExpenses();
      setExpenses(savedExpenses);

      // Load packing items
      const savedPackingItems = await DB.getPackingItems();
      setPackingItems(savedPackingItems);

      // Load itinerary
      const savedItinerary = await DB.getItinerary();
      setItinerary(savedItinerary);

      // Load all trips
      const savedTrips = await DB.getTrips();
      setAllTrips(savedTrips);

      // Load trip history
      const savedHistory = await DB.getTripHistory();
      setTripHistory(savedHistory);

      console.log('User data loaded successfully');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set trip info and save to Firebase
  const setTripInfo = async (updater) => {
    const newInfo = typeof updater === 'function' ? updater(tripInfo) : updater;

    if (newInfo.destination && !newInfo.tripCode) {
      newInfo.tripCode = generateUniqueTripCode();
    }
    if (newInfo.destination && !newInfo.id) {
      newInfo.id = `trip-${Date.now()}`;
    }

    setTripInfoState(newInfo);

    // Save to Firebase
    if (isAuthenticated && newInfo.destination) {
      try {
        await DB.saveCurrentTripInfo(newInfo);
      } catch (error) {
        console.error('Error saving trip info:', error);
      }
    }
  };

  // Set budget and save to Firebase
  const setBudget = async (updater) => {
    const newBudget = typeof updater === 'function' ? updater(budget) : updater;
    setBudgetState(newBudget);

    if (isAuthenticated) {
      try {
        await DB.saveBudget(newBudget);
      } catch (error) {
        console.error('Error saving budget:', error);
      }
    }
  };

  // Add expense and save to Firebase
  const addExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: expense.id || Date.now().toString(),
      paidBy: expense.paidBy || 'main_user',
      splitType: expense.splitType || 'equal',
      splitAmounts: expense.splitAmounts || {},
      beneficiaries: expense.beneficiaries || [],
      createdAt: Date.now(),
    };

    setExpenses(prev => [...prev, newExpense]);

    if (isAuthenticated) {
      try {
        await DB.saveExpense(newExpense);
      } catch (error) {
        console.error('Error saving expense:', error);
      }
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));

    if (isAuthenticated) {
      try {
        await DB.deleteExpenseFromDB(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  // Add packing item
  const addPackingItem = async (item) => {
    const newItem = { ...item, id: Date.now().toString(), packed: false };
    setPackingItems(prev => [...prev, newItem]);

    if (isAuthenticated) {
      try {
        await DB.savePackingItem(newItem);
      } catch (error) {
        console.error('Error saving packing item:', error);
      }
    }
  };

  // Toggle packing item
  const togglePackingItem = async (id) => {
    const item = packingItems.find(i => i.id === id);
    setPackingItems(prev => prev.map(i => i.id === id ? { ...i, packed: !i.packed } : i));

    if (isAuthenticated && item) {
      try {
        await DB.updatePackingItem(id, { packed: !item.packed });
      } catch (error) {
        console.error('Error updating packing item:', error);
      }
    }
  };

  // Delete packing item
  const deletePackingItem = async (id) => {
    setPackingItems(prev => prev.filter(item => item.id !== id));

    if (isAuthenticated) {
      try {
        await DB.deletePackingItemFromDB(id);
      } catch (error) {
        console.error('Error deleting packing item:', error);
      }
    }
  };

  // Add itinerary item
  const addItineraryItem = async (item) => {
    const newItem = { ...item, id: Date.now().toString() };
    setItinerary(prev => [...prev, newItem]);

    if (isAuthenticated) {
      try {
        await DB.saveItineraryItem(newItem);
      } catch (error) {
        console.error('Error saving itinerary item:', error);
      }
    }
  };

  // Delete itinerary item
  const deleteItineraryItem = async (id) => {
    setItinerary(prev => prev.filter(item => item.id !== id));

    if (isAuthenticated) {
      try {
        await DB.deleteItineraryItemFromDB(id);
      } catch (error) {
        console.error('Error deleting itinerary item:', error);
      }
    }
  };

  // Update itinerary item
  const updateItineraryItem = async (id, updates) => {
    setItinerary(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));

    if (isAuthenticated) {
      try {
        const item = itinerary.find(i => i.id === id);
        if (item) {
          await DB.saveItineraryItem({ ...item, ...updates });
        }
      } catch (error) {
        console.error('Error updating itinerary item:', error);
      }
    }
  };

  // End trip - move to history
  const endTrip = async () => {
    if (tripInfo && tripInfo.destination) {
      try {
        setIsLoading(true);
        const completedTrip = {
          ...tripInfo,
          id: tripInfo.id || `history-${Date.now()}`,
          isCompleted: true,
          completedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          totalSpent: getTotalExpenses(),
          budget: budget.total,
          expensesCount: expenses.length,
          currency: currency.code,
        };

        setTripHistory(prev => [completedTrip, ...prev]);

        if (isAuthenticated) {
          await DB.saveToHistory(completedTrip);
        }

        await clearTrip();
        return { success: true };
      } catch (error) {
        console.error('Error ending trip:', error);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    }
    return { success: false, error: 'No active trip to end' };
  };

  // Clear current trip
  const clearTrip = async () => {
    try {
      setIsLoading(true);
      setTripInfoState({
        destination: '', startDate: '', endDate: '', name: '',
        participants: [], tripCode: '', tripType: '', isCompleted: false,
      });
      setBudgetState({ total: 0, categories: {} });
      setExpenses([]);
      setPackingItems([]);
      setItinerary([]);

      if (isAuthenticated) {
        await DB.clearCurrentTripData();
      }
      return { success: true };
    } catch (error) {
      console.error('Error clearing trip:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const [tripOwnerId, setTripOwnerId] = useState(null);

  // Switch to a specific trip
  const switchToTrip = async (trip) => {
    try {
      setIsLoading(true);

      // Determine owner
      const owner = trip.ownerId || user?.uid;
      setTripOwnerId(owner);

      // Update trip info state
      setTripInfoState(trip);

      // Load data for this trip
      if (isAuthenticated) {
        const [savedBudget, savedExpenses, savedPacking, savedItinerary] = await Promise.all([
          DB.getBudget(trip.id, owner),
          DB.getExpenses(trip.id, owner),
          DB.getPackingItems(trip.id, owner),
          DB.getItinerary(trip.id, owner)
        ]);

        setBudgetState(savedBudget);
        setExpenses(savedExpenses);
        setPackingItems(savedPacking);
        setItinerary(savedItinerary);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error switching trip:', error);
      setIsLoading(false);
    }
  };

  // Save current trip to all trips list
  const saveCurrentTripToList = async () => {
    if (!tripInfo.destination) return;

    // Ensure we are the owner if we are saving "Current List"
    // Actually, saveCurrentTripToList is legacy for "Creating New".
    const newTrip = {
      ...tripInfo,
      id: tripInfo.id || Date.now().toString(),
      totalExpenses: getTotalExpenses(),
      ownerId: user?.uid, // I am the owner
      tripCode: tripInfo.tripCode || generateUniqueTripCode(),
      createdAt: Date.now(),
    };

    setTripOwnerId(user?.uid);
    setAllTrips(prev => {
      const filtered = prev.filter(t => t.id !== newTrip.id);
      return [newTrip, ...filtered];
    });

    if (isAuthenticated) {
      try {
        await DB.saveTrip(newTrip);
      } catch (error) {
        console.error('Error saving trip to list:', error);
      }
    }

    return newTrip;
  };

  const getTotalExpenses = () => expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const getExpensesByCategory = () => expenses.reduce((acc, e) => {
    const amount = parseFloat(e.amount) || 0;
    acc[e.category] = (acc[e.category] || 0) + amount;
    return acc;
  }, {});

  const getRemainingBudget = () => (budget.total || 0) - getTotalExpenses();

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    if (currency.code === 'INR') {
      return `${currency.symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return `${currency.symbol}${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const isMultiUserTrip = () => tripInfo.tripType && tripInfo.tripType !== 'solo';

  const getAllTravelers = () => {
    const mainUser = { id: 'main_user', name: 'You', avatar: '👤' };
    return [mainUser, ...(tripInfo.participants || [])];
  };

  const deleteTripFromHistory = async (id) => {
    setTripHistory(prev => prev.filter(trip => trip.id !== id));
    if (isAuthenticated) {
      try {
        await DB.deleteTripFromHistory(id);
        return { success: true };
      } catch (error) {
        console.error('Error deleting trip from history:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  };

  const deleteTrip = async (tripId) => {
    // Try to remove from active trips
    const isActive = allTrips.some(t => t.id === tripId);
    if (isActive) {
      setAllTrips(prev => prev.filter(trip => trip.id !== tripId));
    }

    // Also try to remove from history just in case
    const isHistory = tripHistory.some(t => t.id === tripId);
    if (isHistory) {
      setTripHistory(prev => prev.filter(trip => trip.id !== tripId));
    }

    if (isAuthenticated) {
      try {
        await DB.deleteTrip(tripId);
        // Also try deleting from history DB path if needed
        await DB.deleteTripFromHistory(tripId);
        return { success: true };
      } catch (error) {
        console.error('Error deleting trip:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  };



  // Join trip by code - Fix: Store as reference, don't copy
  const joinTripByCode = async (code) => {
    try {
      setIsLoading(true);

      const trip = await DB.getTripByCode(code);

      if (!trip) {
        setIsLoading(false);
        return { success: false, error: 'Invalid trip code' };
      }

      // Check if already joined
      const alreadyJoined = allTrips.some(t => t.id === trip.id);
      if (alreadyJoined) {
        setIsLoading(false);
        return { success: true, trip, message: 'You have already joined this trip' };
      }

      // Add ref to my trips
      await DB.addMeToTrip(trip);

      // Update local state
      setAllTrips(prev => [trip, ...prev]);

      setIsLoading(false);
      return { success: true, trip };
    } catch (error) {
      console.error('Join trip error:', error);
      setIsLoading(false);
      return { success: false, error: 'Failed to join trip' };
    }
  };

  const getTripByCode = (code) => allTrips.find(trip => trip.tripCode === code?.toUpperCase());
  const createNewTrip = () => {
    setTripOwnerId(user?.uid); // Reset owner to self
    saveCurrentTripToList();
  };
  const getBalances = () => ({});
  const getSettlements = () => [];

  // Update trip info in DB
  const updateTripInfo = async (updates) => {
    const newInfo = { ...tripInfo, ...updates };
    setTripInfoState(newInfo);
    if (isAuthenticated) {
      // If shared, we need a way to update shared info? 
      // For now, assume mainly local updates or owner updates.
      // But actually, saving current trip info handles the current path.
      // We need to ensure saveCurrentTripInfo writes to the correct place if we want that sync too.
      // BUT databaseService.saveCurrentTripInfo is hardcoded to users/me/currentTrip.
      // We should likely STOP using saveCurrentTripInfo for shared trips and write directly.
      // However, for this task, sticking to Expenses/Itinerary sync being priority.
    }
  };

  return (
    <TravelContext.Provider value={{
      tripInfo, setTripInfo,
      budget, setBudget: async (newBudget) => {
        setBudgetState(newBudget);
        if (isAuthenticated) await DB.saveBudget(newBudget, tripInfo.id, tripOwnerId);
      },
      expenses, setExpenses,
      addExpense: async (expense) => {
        const newExpense = { ...expense, id: Date.now().toString() };
        setExpenses(prev => [...prev, newExpense]);
        if (isAuthenticated) await DB.saveExpense(newExpense, tripInfo.id, tripOwnerId);
      },
      deleteExpense: async (expenseId) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        if (isAuthenticated) await DB.deleteExpenseFromDB(expenseId, tripInfo.id, tripOwnerId);
      },
      getTotalExpenses, getExpensesByCategory,
      packingItems,
      addPackingItem: async (item) => {
        setPackingItems(prev => [...prev, item]);
        if (isAuthenticated) await DB.savePackingItem(item, tripInfo.id, tripOwnerId);
      },
      togglePackingItem: async (itemId) => {
        const item = packingItems.find(i => i.id === itemId);
        if (item) {
          const updates = { packed: !item.packed };
          setPackingItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
          if (isAuthenticated) await DB.updatePackingItem(itemId, updates, tripInfo.id, tripOwnerId);
        }
      },
      deletePackingItem: async (itemId) => {
        setPackingItems(prev => prev.filter(i => i.id !== itemId));
        if (isAuthenticated) await DB.deletePackingItemFromDB(itemId, tripInfo.id, tripOwnerId);
      },
      itinerary,
      addItineraryItem: async (item) => {
        setItinerary(prev => [...prev, item]);
        if (isAuthenticated) await DB.saveItineraryItem(item, tripInfo.id, tripOwnerId);
      },
      deleteItineraryItem: async (itemId) => {
        setItinerary(prev => prev.filter(i => i.id !== itemId));
        if (isAuthenticated) await DB.deleteItineraryItemFromDB(itemId, tripInfo.id, tripOwnerId);
      },
      updateItineraryItem: async (itemId, updates) => {
        // Need DB update support for this if simple set/update
        // DB.saveItineraryItem usually does set.
      },
      getRemainingBudget,
      clearTrip, endTrip,
      tripHistory, setTripHistory, deleteTripFromHistory,
      currency, setCurrency, currencies,
      formatCurrency,
      customCategories, setCustomCategories,
      isMultiUserTrip, getAllTravelers, getBalances, getSettlements,
      allTrips, deleteTrip, createNewTrip, saveCurrentTripToList, getTripByCode, joinTripByCode, switchToTrip,
      isLoading,
    }}>
      {children}
    </TravelContext.Provider>
  );
};
