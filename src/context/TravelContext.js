import React, { createContext, useState, useContext } from 'react';

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
  const [tripInfo, setTripInfo] = useState({
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
  const [currency, setCurrency] = useState(CURRENCIES[0]); // INR default
  const [customCategories, setCustomCategories] = useState(DEFAULT_CATEGORIES);

  const addExpense = (expense) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
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

  const getRemainingBudget = () => {
    return (budget.total || 0) - getTotalExpenses();
  };

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
    if (tripInfo.destination) {
      const completedTrip = {
        id: Date.now().toString(),
        ...tripInfo,
        isCompleted: true,
        completedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        totalSpent: getTotalExpenses(),
        budget: budget.total,
        expensesCount: expenses.length,
        activitiesCount: itinerary.length,
        packingItemsCount: packingItems.length,
        currency: currency.code,
      };
      setTripHistory(prev => [completedTrip, ...prev]);
      clearTrip();
    }
  };

  const clearTrip = () => {
    setTripInfo({
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

  return (
    <TravelContext.Provider value={{
      tripInfo, setTripInfo,
      budget, setBudget,
      expenses, addExpense, deleteExpense, getTotalExpenses, getExpensesByCategory,
      packingItems, addPackingItem, togglePackingItem, deletePackingItem,
      itinerary, addItineraryItem, deleteItineraryItem, updateItineraryItem,
      getRemainingBudget,
      clearTrip, endTrip,
      tripHistory, deleteTripFromHistory,
      currency, setCurrency, currencies: CURRENCIES,
      formatCurrency,
      customCategories, setCustomCategories,
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
