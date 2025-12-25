import {
  database,
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  off,
  auth
} from '../config/firebase';

const getUserId = () => auth.currentUser?.uid;

// ============ TRIPS ============
export const saveTrip = async (tripData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const tripId = tripData.id || push(ref(database, `users/${userId}/trips`)).key;
  const tripRef = ref(database, `users/${userId}/trips/${tripId}`);

  await set(tripRef, { ...tripData, id: tripId, updatedAt: Date.now(), createdAt: tripData.createdAt || Date.now() });

  // If trip has a code, map it globally
  if (tripData.tripCode) {
    await saveTripCodeMapping(tripData.tripCode, userId, tripId);
  }

  return { ...tripData, id: tripId };
};

export const getTrips = async () => {
  const userId = getUserId();
  if (!userId) return [];

  const snapshot = await get(ref(database, `users/${userId}/trips`));
  return snapshot.exists() ? Object.values(snapshot.val()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : [];
};

export const deleteTrip = async (tripId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await remove(ref(database, `users/${userId}/trips/${tripId}`));
};

// ============ TRIP CODES & SHARING ============
export const saveTripCodeMapping = async (code, userId, tripId) => {
  await set(ref(database, `tripCodes/${code}`), { userId, tripId });
};

export const getTripByCode = async (code) => {
  // 1. Look up code in 'tripCodes'
  const codeSnapshot = await get(ref(database, `tripCodes/${code}`));
  if (!codeSnapshot.exists()) return null;

  const { userId, tripId } = codeSnapshot.val();

  // 2. Fetch trip data
  const tripSnapshot = await get(ref(database, `users/${userId}/trips/${tripId}`));
  return tripSnapshot.exists() ? tripSnapshot.val() : null;
};

export const addMeToTrip = async (trip) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Add trip to my trips
  await saveTrip(trip);
};

// ============ CURRENT TRIP ============
export const saveCurrentTripInfo = async (tripInfo) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await set(ref(database, `users/${userId}/currentTrip/info`), { ...tripInfo, updatedAt: Date.now() });
};

export const getCurrentTripInfo = async () => {
  const userId = getUserId();
  if (!userId) return null;
  const snapshot = await get(ref(database, `users/${userId}/currentTrip/info`));
  return snapshot.exists() ? snapshot.val() : null;
};

// ============ EXPENSES ============
export const saveExpense = async (expense) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const expenseId = expense.id || push(ref(database, `users/${userId}/currentTrip/expenses`)).key;
  await set(ref(database, `users/${userId}/currentTrip/expenses/${expenseId}`), { ...expense, id: expenseId, createdAt: expense.createdAt || Date.now() });
  return { ...expense, id: expenseId };
};

export const getExpenses = async () => {
  const userId = getUserId();
  if (!userId) return [];
  const snapshot = await get(ref(database, `users/${userId}/currentTrip/expenses`));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const deleteExpenseFromDB = async (expenseId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await remove(ref(database, `users/${userId}/currentTrip/expenses/${expenseId}`));
};

// ============ PACKING ITEMS ============
export const savePackingItem = async (item) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const itemId = item.id || push(ref(database, `users/${userId}/currentTrip/packingItems`)).key;
  await set(ref(database, `users/${userId}/currentTrip/packingItems/${itemId}`), { ...item, id: itemId });
  return { ...item, id: itemId };
};

export const getPackingItems = async () => {
  const userId = getUserId();
  if (!userId) return [];
  const snapshot = await get(ref(database, `users/${userId}/currentTrip/packingItems`));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const updatePackingItem = async (itemId, updates) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await update(ref(database, `users/${userId}/currentTrip/packingItems/${itemId}`), updates);
};

export const deletePackingItemFromDB = async (itemId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await remove(ref(database, `users/${userId}/currentTrip/packingItems/${itemId}`));
};

// ============ ITINERARY ============
export const saveItineraryItem = async (item) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const itemId = item.id || push(ref(database, `users/${userId}/currentTrip/itinerary`)).key;
  await set(ref(database, `users/${userId}/currentTrip/itinerary/${itemId}`), { ...item, id: itemId });
  return { ...item, id: itemId };
};

export const getItinerary = async () => {
  const userId = getUserId();
  if (!userId) return [];
  const snapshot = await get(ref(database, `users/${userId}/currentTrip/itinerary`));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const deleteItineraryItemFromDB = async (itemId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await remove(ref(database, `users/${userId}/currentTrip/itinerary/${itemId}`));
};

// ============ BUDGET ============
export const saveBudget = async (budget) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await set(ref(database, `users/${userId}/currentTrip/budget`), budget);
};

export const getBudget = async () => {
  const userId = getUserId();
  if (!userId) return { total: 0, categories: {} };
  const snapshot = await get(ref(database, `users/${userId}/currentTrip/budget`));
  return snapshot.exists() ? snapshot.val() : { total: 0, categories: {} };
};

// ============ CLEAR & HISTORY ============
export const clearCurrentTripData = async () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await remove(ref(database, `users/${userId}/currentTrip`));
};

export const saveToHistory = async (tripData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const historyId = push(ref(database, `users/${userId}/tripHistory`)).key;
  await set(ref(database, `users/${userId}/tripHistory/${historyId}`), { ...tripData, id: historyId, completedAt: Date.now() });
};

export const getTripHistory = async () => {
  const userId = getUserId();
  if (!userId) return [];
  const snapshot = await get(ref(database, `users/${userId}/tripHistory`));
  return snapshot.exists() ? Object.values(snapshot.val()).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)) : [];
};

// ============ DELETE ALL USER DATA ============
export const deleteAllUserData = async () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Remove all user data from database
  await remove(ref(database, `users/${userId}`));
  console.log('All user data deleted from database');
};
