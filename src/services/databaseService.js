import { ref, set, get, update, remove, onValue, push, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../config/firebase';

// Subscribe to user's trips
export const subscribeToTrips = (userId, callback) => {
  const tripsRef = ref(database, `users/${userId}/trips`);
  
  const unsubscribe = onValue(tripsRef, (snapshot) => {
    const data = snapshot.val();
    const trips = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    callback(trips);
  });
  
  return unsubscribe;
};

// Subscribe to trip history
export const subscribeToTripHistory = (userId, callback) => {
  const historyRef = ref(database, `users/${userId}/history`);
  
  const unsubscribe = onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    const history = data ? Object.keys(data).map(key => ({ ...data[key], historyId: key })) : [];
    callback(history);
  });
  
  return unsubscribe;
};

// Subscribe to a specific trip
export const subscribeToTrip = (userId, tripId, callback) => {
  const tripRef = ref(database, `users/${userId}/trips/${tripId}`);
  
  const unsubscribe = onValue(tripRef, (snapshot) => {
    callback(snapshot.val());
  });
  
  return unsubscribe;
};

// Create a new trip
export const createTrip = async (userId, trip) => {
  const tripRef = ref(database, `users/${userId}/trips/${trip.id}`);
  await set(tripRef, trip);
  
  // Also save trip code mapping
  if (trip.tripCode) {
    const codeRef = ref(database, `tripCodes/${trip.tripCode}`);
    await set(codeRef, {
      tripId: trip.id,
      ownerId: userId,
      destination: trip.destination,
      createdAt: new Date().toISOString(),
    });
  }
};

// Save/update trip
export const saveTrip = async (userId, tripId, trip) => {
  const tripRef = ref(database, `users/${userId}/trips/${tripId}`);
  await update(tripRef, trip);
};

// Delete trip
export const deleteTrip = async (userId, tripId, tripCode) => {
  const tripRef = ref(database, `users/${userId}/trips/${tripId}`);
  await remove(tripRef);
  
  // Remove trip code mapping
  if (tripCode) {
    const codeRef = ref(database, `tripCodes/${tripCode}`);
    await remove(codeRef);
  }
};

// Save expenses
export const saveExpenses = async (userId, tripId, expenses) => {
  const expensesRef = ref(database, `users/${userId}/trips/${tripId}/expenses`);
  await set(expensesRef, expenses);
};

// Save packing items
export const savePackingItems = async (userId, tripId, items) => {
  const itemsRef = ref(database, `users/${userId}/trips/${tripId}/packingItems`);
  await set(itemsRef, items);
};

// Save itinerary
export const saveItinerary = async (userId, tripId, itinerary) => {
  const itineraryRef = ref(database, `users/${userId}/trips/${tripId}/itinerary`);
  await set(itineraryRef, itinerary);
};

// Save budget
export const saveBudget = async (userId, tripId, budget) => {
  const budgetRef = ref(database, `users/${userId}/trips/${tripId}/budget`);
  await set(budgetRef, budget);
};

// Save trip to history
export const saveTripToHistory = async (userId, trip) => {
  const historyRef = ref(database, `users/${userId}/history`);
  const newHistoryRef = push(historyRef);
  await set(newHistoryRef, trip);
};

// Delete trip from history
export const deleteTripFromHistory = async (userId, historyId) => {
  const historyRef = ref(database, `users/${userId}/history/${historyId}`);
  await remove(historyRef);
};

// Join trip by code
export const joinTrip = async (userId, tripCode, userName) => {
  const codeRef = ref(database, `tripCodes/${tripCode}`);
  const snapshot = await get(codeRef);
  
  if (!snapshot.exists()) {
    return { success: false, error: 'Trip code not found' };
  }
  
  const tripData = snapshot.val();
  const ownerId = tripData.ownerId;
  const tripId = tripData.tripId;
  
  // Get the trip details
  const tripRef = ref(database, `users/${ownerId}/trips/${tripId}`);
  const tripSnapshot = await get(tripRef);
  
  if (!tripSnapshot.exists()) {
    return { success: false, error: 'Trip not found' };
  }
  
  const trip = tripSnapshot.val();
  
  // Add user to participants
  const participants = trip.participants || [];
  participants.push({ name: userName, joinedAt: new Date().toISOString() });
  
  await update(tripRef, { participants });
  
  // Create a copy for the joining user
  const userTripRef = ref(database, `users/${userId}/trips/${tripId}`);
  await set(userTripRef, {
    ...trip,
    participants,
    joinedViaCode: true,
    originalOwnerId: ownerId,
  });
  
  return { success: true, trip: { ...trip, id: tripId } };
};

// Get trip by code
export const getTripByCode = async (tripCode) => {
  const codeRef = ref(database, `tripCodes/${tripCode}`);
  const snapshot = await get(codeRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const tripData = snapshot.val();
  const ownerId = tripData.ownerId;
  const tripId = tripData.tripId;
  
  const tripRef = ref(database, `users/${ownerId}/trips/${tripId}`);
  const tripSnapshot = await get(tripRef);
  
  return tripSnapshot.exists() ? { ...tripSnapshot.val(), id: tripId } : null;
};
