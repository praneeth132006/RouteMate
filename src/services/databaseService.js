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

  // 1. Fetch trip data to check for tripCode
  const tripRef = ref(database, `users/${userId}/trips/${tripId}`);
  const snapshot = await get(tripRef);

  if (snapshot.exists()) {
    const tripData = snapshot.val();
    // 2. If it has a tripCode, release it
    if (tripData.tripCode) {
      await deleteTripCodeMapping(tripData.tripCode);
    }
  }

  // 3. Delete the trip
  await remove(tripRef);
};

// ============ TRIP CODES & SHARING ============
export const saveTripCodeMapping = async (code, userId, tripId) => {
  await set(ref(database, `tripCodes/${code}`), { userId, tripId });
};

export const deleteTripCodeMapping = async (code) => {
  if (!code) return;
  await remove(ref(database, `tripCodes/${code}`));
};

export const checkTripCodeExists = async (code) => {
  if (!code) return false;
  const snapshot = await get(ref(database, `tripCodes/${code}`));
  return snapshot.exists();
};

export const getTripByCode = async (code) => {
  console.log(`[DB] Looking up trip code: ${code}`);

  // 1. Look up code in 'tripCodes'
  try {
    const codeSnapshot = await get(ref(database, `tripCodes/${code}`));
    if (!codeSnapshot.exists()) {
      console.log(`[DB] Code ${code} not found in tripCodes`);
      return null;
    }

    const { userId, tripId } = codeSnapshot.val();
    console.log(`[DB] Code found. Owner: ${userId}, TripId: ${tripId}`);

    // 2. Fetch trip data
    const tripPath = `users/${userId}/trips/${tripId}`;
    console.log(`[DB] Fetching trip data from: ${tripPath}`);

    const tripSnapshot = await get(ref(database, tripPath));
    if (!tripSnapshot.exists()) {
      console.log(`[DB] Trip data not found at ${tripPath}`);
      return null;
    }

    return { ...tripSnapshot.val(), ownerId: userId };
  } catch (error) {
    console.error(`[DB] Permission/Network Error in getTripByCode:`, error);
    throw error; // Re-throw so UI sees it
  }
};

export const addMeToTrip = async (trip) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Add trip to my trips
  // Add trip KEY info to my trips (not the whole data if it's large, but here we keep it simple)
  // We MUST ensure we save the ownership info
  const myTripRef = {
    id: trip.id,
    destination: trip.destination,
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    name: trip.name || '',
    tripCode: trip.tripCode || '',
    ownerId: trip.ownerId, // CRITICAL: Save who owns it
    isShared: true,
    addedAt: Date.now()
  };

  await set(ref(database, `users/${userId}/trips/${trip.id}`), myTripRef);
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
// ============ EXPENSES ============
export const saveExpense = async (expense, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId(); // Use ownerId if provided (shared trip), else active user
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/expenses`
    : `users/${userId}/trips/${tripId}/expenses`;

  const expenseId = expense.id || push(ref(database, path)).key;
  await set(ref(database, `${path}/${expenseId}`), { ...expense, id: expenseId, createdAt: expense.createdAt || Date.now() });
  return { ...expense, id: expenseId };
};

export const getExpenses = async (tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) return [];

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/expenses`
    : `users/${userId}/trips/${tripId}/expenses`;

  const snapshot = await get(ref(database, path));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const deleteExpenseFromDB = async (expenseId, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/expenses/${expenseId}`
    : `users/${userId}/trips/${tripId}/expenses/${expenseId}`;

  await remove(ref(database, path));
};

// ============ PACKING ITEMS ============
// ============ PACKING ITEMS ============
export const savePackingItem = async (item, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/packingItems`
    : `users/${userId}/trips/${tripId}/packingItems`;

  const itemId = item.id || push(ref(database, path)).key;
  await set(ref(database, `${path}/${itemId}`), { ...item, id: itemId });
  return { ...item, id: itemId };
};

export const getPackingItems = async (tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) return [];

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/packingItems`
    : `users/${userId}/trips/${tripId}/packingItems`;

  const snapshot = await get(ref(database, path));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const updatePackingItem = async (itemId, updates, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/packingItems/${itemId}`
    : `users/${userId}/trips/${tripId}/packingItems/${itemId}`;

  await update(ref(database, path), updates);
};

export const deletePackingItemFromDB = async (itemId, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/packingItems/${itemId}`
    : `users/${userId}/trips/${tripId}/packingItems/${itemId}`;

  await remove(ref(database, path));
};

// ============ ITINERARY ============
// ============ ITINERARY ============
export const saveItineraryItem = async (item, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/itinerary`
    : `users/${userId}/trips/${tripId}/itinerary`;

  const itemId = item.id || push(ref(database, path)).key;
  await set(ref(database, `${path}/${itemId}`), { ...item, id: itemId });
  return { ...item, id: itemId };
};

export const getItinerary = async (tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) return [];

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/itinerary`
    : `users/${userId}/trips/${tripId}/itinerary`;

  const snapshot = await get(ref(database, path));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const deleteItineraryItemFromDB = async (itemId, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/itinerary/${itemId}`
    : `users/${userId}/trips/${tripId}/itinerary/${itemId}`;

  await remove(ref(database, path));
};

// ============ BUDGET ============
// ============ BUDGET ============
export const saveBudget = async (budget, tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) throw new Error('User not authenticated');

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/budget`
    : `users/${userId}/trips/${tripId}/budget`;

  await set(ref(database, path), budget);
};

export const getBudget = async (tripId = null, ownerId = null) => {
  const userId = ownerId || getUserId();
  if (!userId) return { total: 0, categories: {} };

  const isCurrent = !tripId || tripId === 'current';
  const path = isCurrent
    ? `users/${userId}/currentTrip/budget`
    : `users/${userId}/trips/${tripId}/budget`;

  const snapshot = await get(ref(database, path));
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

// ============ USER SETTINGS (Theme, Currency, etc.) ============
export const saveUserSettings = async (settings) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  await update(ref(database, `users/${userId}/settings`), { ...settings, updatedAt: Date.now() });
};

export const getUserSettings = async () => {
  const userId = getUserId();
  if (!userId) return null;
  const snapshot = await get(ref(database, `users/${userId}/settings`));
  return snapshot.exists() ? snapshot.val() : null;
};

// ============ DELETE ALL USER DATA ============
export const deleteAllUserData = async () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Remove all user data from database
  await remove(ref(database, `users/${userId}`));
  console.log('All user data deleted from database');
};
