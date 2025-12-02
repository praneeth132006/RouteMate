import React, { createContext, useState, useContext } from 'react';
import { generateUniqueTripCode } from '../utils/tripCodeGenerator';

const TravelContext = createContext();

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
];

const DEFAULT_CATEGORIES = [
  { key: 'accommodation', label: 'Stay', emoji: '🏨', color: '#8B5CF6', tip: '30-40%' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6', tip: '15-25%' },
  { key: 'food', label: 'Food', emoji: '🍽️', color: '#F59E0B', tip: '20-30%' },
  { key: 'activities', label: 'Activities', emoji: '🎭', color: '#10B981', tip: '10-15%' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899', tip: '5-10%' },
  { key: 'other', label: 'Other', emoji: '📦', color: '#6B7280', tip: '5-10%' },
];

export function TravelProvider({ children }) {
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

  const [budget, setBudget] = useState({ total: 0, categories: {} });
  const [expenses, setExpenses] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [customCategories, setCustomCategories] = useState(DEFAULT_CATEGORIES);
  const [allTrips, setAllTrips] = useState([]);

  const setTripInfo = (updater) => {
    setTripInfoState(prev => {
      const newInfo = typeof updater === 'function' ? updater(prev) : updater;
      
      // Generate tripCode if destination exists but no code
      if (newInfo.destination && !newInfo.tripCode) {
        newInfo.tripCode = generateUniqueTripCode();
      }
      
      // Generate ID if destination exists but no ID
      if (newInfo.destination && !newInfo.id) {
        newInfo.id = `trip-${Date.now()}`;
      }
      
      // If this is a new trip (has destination and wasn't in prev), add to allTrips
      if (newInfo.destination && newInfo.id && (!prev.destination || prev.id !== newInfo.id)) {
        setAllTrips(prevTrips => {
          // Check if trip already exists
          const exists = prevTrips.some(t => t.id === newInfo.id);
          if (!exists) {
            return [newInfo, ...prevTrips];
          }
          // Update existing trip
          return prevTrips.map(t => t.id === newInfo.id ? newInfo : t);
        });
      }
      
      return newInfo;
    });
  };

  const isMultiUserTrip = () => tripInfo.tripType && tripInfo.tripType !== 'solo';

  const getAllTravelers = () => {
    const mainUser = { id: 'main_user', name: 'You', avatar: '👤' };
    return [mainUser, ...(tripInfo.participants || [])];
  };

  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      paidBy: expense.paidBy || 'main_user',
      splitType: expense.splitType || 'equal',
      splitAmounts: expense.splitAmounts || {},
      beneficiaries: expense.beneficiaries || [],
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  };

  const getExpensesByCategory = () => {
    return expenses.reduce((acc, e) => {
      const amount = parseFloat(e.amount) || 0;
      acc[e.category] = (acc[e.category] || 0) + amount;
      return acc;
    }, {});
  };

  const getRemainingBudget = () => (budget.total || 0) - getTotalExpenses();

  const getBalances = () => {
    if (!isMultiUserTrip()) return {};
    const travelers = getAllTravelers();
    const balances = {};
    travelers.forEach(t => {
      balances[t.id] = { paid: 0, owes: 0, balance: 0, name: t.name };
    });
    return balances;
  };

  const getSettlements = () => [];

  const addPackingItem = (item) => {
    setPackingItems(prev => [...prev, { ...item, id: Date.now().toString(), packed: false }]);
  };

  const togglePackingItem = (id) => {
    setPackingItems(prev => prev.map(item =>
      item.id === id ? { ...item, packed: !item.packed } : item
    ));
  };

  const deletePackingItem = (id) => {
    setPackingItems(prev => prev.filter(item => item.id !== id));
  };

  const addItineraryItem = (item) => {
    setItinerary(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };

  const deleteItineraryItem = (id) => {
    setItinerary(prev => prev.filter(item => item.id !== id));
  };

  const updateItineraryItem = (id, updates) => {
    setItinerary(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const endTrip = () => {
    if (tripInfo && tripInfo.destination) {
      const completedTrip = {
        id: `history-${Date.now()}`,
        ...tripInfo,
        isCompleted: true,
        completedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        totalSpent: getTotalExpenses(),
        budget: budget.total,
        expensesCount: expenses.length,
        currency: currency.code,
      };
      setTripHistory(prev => [completedTrip, ...prev]);
      if (tripInfo.id) {
        setAllTrips(prev => prev.filter(t => t.id !== tripInfo.id));
      }
      clearTrip();
    }
  };

  const clearTrip = () => {
    setTripInfoState({
      destination: '',
      startDate: '',
      endDate: '',
      name: '',
      participants: [],
      tripCode: '',
      tripType: '',
      isCompleted: false,
    });
    setBudget({ total: 0, categories: {} });
    setExpenses([]);
    setPackingItems([]);
    setItinerary([]);
  };

  const deleteTripFromHistory = (id) => {
    setTripHistory(prev => prev.filter(trip => trip.id !== id));
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    if (currency.code === 'INR') {
      return `${currency.symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return `${currency.symbol}${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const createNewTrip = (tripData) => {
    const tripCode = generateUniqueTripCode();
    const newTrip = {
      ...tripData,
      id: `trip-${Date.now()}`,
      tripCode,
      totalExpenses: 0,
      createdAt: new Date().toISOString(),
    };
    setTripInfoState(newTrip);
    setAllTrips(prev => [newTrip, ...prev]);
    return newTrip;
  };

  const switchToTrip = (trip) => {
    if (!trip) return;
    setTripInfoState(trip);
    setExpenses(trip.expenses || []);
    setPackingItems(trip.packingItems || []);
    setItinerary(trip.itinerary || []);
    setBudget(trip.budget || { total: 0, categories: {} });
  };

  const deleteTrip = (tripId) => {
    setAllTrips(prev => prev.filter(trip => trip.id !== tripId));
  };

  const saveCurrentTripToList = () => {
    if (tripInfo && tripInfo.destination) {
      const tripToSave = {
        ...tripInfo,
        id: tripInfo.id || `trip-${Date.now()}`,
        tripCode: tripInfo.tripCode || generateUniqueTripCode(),
        totalExpenses: getTotalExpenses(),
        expenses,
        packingItems,
        itinerary,
        budget,
      };
      setAllTrips(prev => {
        const idx = prev.findIndex(t => t.id === tripToSave.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = tripToSave;
          return updated;
        }
        return [tripToSave, ...prev];
      });
      return tripToSave;
    }
    return null;
  };

  const getTripByCode = (code) => {
    return allTrips.find(trip => trip.tripCode === code.toUpperCase());
  };

  return (
    <TravelContext.Provider value={{
      tripInfo, setTripInfo,
      budget, setBudget,
      expenses, setExpenses, addExpense, deleteExpense,
      getTotalExpenses, getExpensesByCategory,
      packingItems, addPackingItem, togglePackingItem, deletePackingItem,
      itinerary, addItineraryItem, deleteItineraryItem, updateItineraryItem,
      getRemainingBudget,
      clearTrip, endTrip,
      tripHistory, setTripHistory, deleteTripFromHistory,
      currency, setCurrency, currencies: CURRENCIES,
      formatCurrency,
      customCategories, setCustomCategories,
      isMultiUserTrip, getAllTravelers, getBalances, getSettlements,
      allTrips, deleteTrip, createNewTrip, saveCurrentTripToList, getTripByCode, switchToTrip,
    }}>
      {children}
    </TravelContext.Provider>
  );
}

export function useTravelContext() {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
}
