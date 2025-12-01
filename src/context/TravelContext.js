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
  const [tripInfo, setTripInfo] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    name: '',
    participants: [], // Array of { id, name, avatar }
    tripCode: '',
    tripType: '', // 'solo', 'couple', 'family', 'friends', 'business'
    isCompleted: false,
  });

  const [budget, setBudget] = useState({ total: 0, categories: {} });
  const [expenses, setExpenses] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [customCategories, setCustomCategories] = useState(DEFAULT_CATEGORIES);
  const [allTrips, setAllTrips] = useState([]); // Manage multiple trips

  // Check if trip is multi-user (not solo)
  const isMultiUserTrip = () => {
    return tripInfo.tripType && tripInfo.tripType !== 'solo';
  };

  // Get all travelers (including the main user "You")
  const getAllTravelers = () => {
    const mainUser = { id: 'main_user', name: 'You', avatar: '👤' };
    return [mainUser, ...(tripInfo.participants || [])];
  };

  // Add expense with split information for multi-user trips
  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      // For multi-user trips, include split info
      paidBy: expense.paidBy || 'main_user',
      splitType: expense.splitType || 'equal', // 'equal', 'custom', 'full'
      splitAmounts: expense.splitAmounts || {}, // { odredId: amount }
      beneficiaries: expense.beneficiaries || [], // Array of user IDs who benefit from this expense
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const deleteExpense = (id) => {
    console.log('Deleting expense with id:', id);
    setExpenses(prevExpenses => {
      const newExpenses = prevExpenses.filter(expense => expense.id !== id);
      console.log('Expenses after delete:', newExpenses.length);
      return newExpenses;
    });
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

  // Get balance for each person (who owes whom)
  const getBalances = () => {
    if (!isMultiUserTrip()) return {};

    const travelers = getAllTravelers();
    const balances = {};

    // Initialize balances
    travelers.forEach(t => {
      balances[t.id] = { paid: 0, owes: 0, balance: 0, name: t.name };
    });

    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount) || 0;
      const paidBy = expense.paidBy || 'main_user';
      const beneficiaries = expense.beneficiaries?.length > 0 
        ? expense.beneficiaries 
        : travelers.map(t => t.id);

      // Add to payer's paid amount
      if (balances[paidBy]) {
        balances[paidBy].paid += amount;
      }

      // Calculate what each beneficiary owes
      if (expense.splitType === 'equal') {
        const splitAmount = amount / beneficiaries.length;
        beneficiaries.forEach(id => {
          if (balances[id]) {
            balances[id].owes += splitAmount;
          }
        });
      } else if (expense.splitType === 'custom' && expense.splitAmounts) {
        Object.entries(expense.splitAmounts).forEach(([id, splitAmount]) => {
          if (balances[id]) {
            balances[id].owes += parseFloat(splitAmount) || 0;
          }
        });
      } else if (expense.splitType === 'full') {
        // Full amount to first beneficiary
        if (beneficiaries[0] && balances[beneficiaries[0]]) {
          balances[beneficiaries[0]].owes += amount;
        }
      }
    });

    // Calculate net balance (positive = owed money, negative = owes money)
    Object.keys(balances).forEach(id => {
      balances[id].balance = balances[id].paid - balances[id].owes;
    });

    return balances;
  };

  // Get simplified debts (who should pay whom)
  const getSettlements = () => {
    const balances = getBalances();
    const settlements = [];

    const debtors = Object.entries(balances)
      .filter(([_, b]) => b.balance < -0.01)
      .map(([id, b]) => ({ id, amount: Math.abs(b.balance), name: b.name }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balances)
      .filter(([_, b]) => b.balance > 0.01)
      .map(([id, b]) => ({ id, amount: b.balance, name: b.name }))
      .sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.id,
          fromName: debtor.name,
          to: creditor.id,
          toName: creditor.name,
          amount: settleAmount,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return settlements;
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

  // Add a new trip
  const addTrip = (newTripInfo) => {
    const tripCode = generateUniqueTripCode();
    const tripWithId = {
      ...newTripInfo,
      id: Date.now().toString(),
      tripCode: tripCode,
      totalExpenses: 0,
      createdAt: new Date().toISOString(),
    };
    setAllTrips(prevTrips => [...prevTrips, tripWithId]);
    return tripWithId;
  };

  // Update an existing trip
  const updateTrip = (tripId, updates) => {
    setAllTrips(prevTrips => 
      prevTrips.map(trip => 
        trip.id === tripId ? { ...trip, ...updates } : trip
      )
    );
  };

  // Delete a trip
  const deleteTrip = (tripId) => {
    setAllTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
  };

  // Function to create a new trip with unique code
  const createNewTrip = (tripData) => {
    const tripCode = generateUniqueTripCode();
    const newTrip = {
      ...tripData,
      id: Date.now().toString(),
      tripCode: tripCode,
      totalExpenses: 0,
      createdAt: new Date().toISOString(),
    };
    
    setTripInfo(newTrip);
    setAllTrips(prevTrips => [newTrip, ...prevTrips]);
    
    return newTrip;
  };

  // Function to add trip to list (for when trip is saved/completed)
  const saveCurrentTripToList = () => {
    if (tripInfo && tripInfo.destination) {
      const tripCode = tripInfo.tripCode || generateUniqueTripCode();
      const tripToSave = {
        ...tripInfo,
        id: tripInfo.id || Date.now().toString(),
        tripCode: tripCode,
        totalExpenses: getTotalExpenses(),
        savedAt: new Date().toISOString(),
      };
      
      // Update tripInfo with the code
      setTripInfo(prev => ({ ...prev, tripCode: tripCode, id: tripToSave.id }));
      
      setAllTrips(prevTrips => {
        const existingIndex = prevTrips.findIndex(t => t.id === tripToSave.id);
        if (existingIndex >= 0) {
          const updated = [...prevTrips];
          updated[existingIndex] = tripToSave;
          return updated;
        }
        return [tripToSave, ...prevTrips];
      });
      
      return tripToSave;
    }
    return null;
  };

  // Function to get trip by code
  const getTripByCode = (code) => {
    const normalized = code.toUpperCase().replace(/[-\s]/g, '');
    return allTrips.find(trip => trip.tripCode === normalized);
  };

  // Function to switch to a different trip
  const switchToTrip = (trip) => {
    setTripInfo(trip);
    // Also load that trip's expenses, packing items, etc.
  };

  // Auto-save trip to allTrips whenever tripInfo changes with a valid destination
  React.useEffect(() => {
    if (tripInfo && tripInfo.destination && tripInfo.startDate) {
      const tripCode = tripInfo.tripCode || generateUniqueTripCode();
      const tripId = tripInfo.id || `trip-${Date.now()}`;
      
      // Update tripInfo with ID and code if missing
      if (!tripInfo.id || !tripInfo.tripCode) {
        setTripInfo(prev => ({
          ...prev,
          id: tripId,
          tripCode: tripCode,
        }));
      }
      
      // Save to allTrips
      setAllTrips(prevTrips => {
        const tripToSave = {
          ...tripInfo,
          id: tripId,
          tripCode: tripCode,
          totalExpenses: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
          updatedAt: new Date().toISOString(),
        };
        
        const existingIndex = prevTrips.findIndex(t => 
          t.id === tripId || 
          (t.destination === tripInfo.destination && t.startDate === tripInfo.startDate)
        );
        
        if (existingIndex >= 0) {
          // Update existing trip
          const updated = [...prevTrips];
          updated[existingIndex] = { ...updated[existingIndex], ...tripToSave };
          return updated;
        } else {
          // Add new trip
          return [tripToSave, ...prevTrips];
        }
      });
    }
  }, [tripInfo.destination, tripInfo.startDate, tripInfo.endDate, tripInfo.tripType]);

  // Updated setTripInfo wrapper to ensure trip code is generated
  const updateTripInfo = (updater) => {
    setTripInfo(prev => {
      const newInfo = typeof updater === 'function' ? updater(prev) : updater;
      
      // Auto-generate trip code and ID if this is a new trip with destination
      if (newInfo.destination && !newInfo.tripCode) {
        newInfo.tripCode = generateUniqueTripCode();
      }
      if (newInfo.destination && !newInfo.id) {
        newInfo.id = `trip-${Date.now()}`;
      }
      
      return newInfo;
    });
  };

  // Make sure deleteExpense is included in the context value
  return (
    <TravelContext.Provider value={{
      tripInfo, 
      setTripInfo: updateTripInfo, // Use the wrapper instead of raw setTripInfo
      budget, setBudget,
      expenses,
      setExpenses,
      addExpense,
      deleteExpense,
      getTotalExpenses, getExpensesByCategory,
      packingItems, addPackingItem, togglePackingItem, deletePackingItem,
      itinerary, addItineraryItem, deleteItineraryItem, updateItineraryItem,
      getRemainingBudget,
      clearTrip, endTrip,
      tripHistory, deleteTripFromHistory,
      currency, setCurrency, currencies: CURRENCIES,
      formatCurrency,
      customCategories, setCustomCategories,
      // Multi-user functions
      isMultiUserTrip,
      getAllTravelers,
      getBalances,
      getSettlements,
      // Manage multiple trips
      allTrips, addTrip, updateTrip, deleteTrip,
      createNewTrip,
      saveCurrentTripToList,
      getTripByCode,
      switchToTrip,
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
