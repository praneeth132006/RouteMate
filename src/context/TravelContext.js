import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TravelContext = createContext(null);

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravelContext must be used within TravelProvider');
  }
  return context;
};

export const TravelProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [budget, setBudget] = useState({
    total: 0,
    categories: {
      accommodation: 0,
      transport: 0,
      food: 0,
      activities: 0,
      shopping: 0,
      other: 0,
    }
  });

  const [expenses, setExpenses] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [tripInfo, setTripInfo] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    currency: 'USD'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [budget, expenses, packingItems, itinerary, tripInfo, isLoaded]);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('travelData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.packingItems) setPackingItems(parsed.packingItems);
        if (parsed.itinerary) setItinerary(parsed.itinerary);
        if (parsed.tripInfo) setTripInfo(parsed.tripInfo);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('travelData', JSON.stringify({
        budget, expenses, packingItems, itinerary, tripInfo
      }));
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  const addExpense = (expense) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
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

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const getRemainingBudget = () => {
    return budget.total - getTotalExpenses();
  };

  const getExpensesByCategory = () => {
    return expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
      return acc;
    }, {});
  };

  const value = {
    budget, setBudget,
    expenses, addExpense, deleteExpense,
    packingItems, addPackingItem, togglePackingItem, deletePackingItem,
    itinerary, addItineraryItem, deleteItineraryItem,
    tripInfo, setTripInfo,
    getTotalExpenses, getRemainingBudget, getExpensesByCategory,
    isLoaded
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};
