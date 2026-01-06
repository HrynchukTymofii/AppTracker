import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseType } from './poseUtils';

const FAVORITES_KEY = '@exercise_favorites';
const MAX_FAVORITES = 4;

export async function getFavorites(): Promise<ExerciseType[]> {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

export async function toggleFavorite(type: ExerciseType): Promise<{ favorites: ExerciseType[]; added: boolean }> {
  try {
    const favorites = await getFavorites();
    const index = favorites.indexOf(type);

    if (index >= 0) {
      // Remove from favorites
      favorites.splice(index, 1);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return { favorites, added: false };
    } else if (favorites.length < MAX_FAVORITES) {
      // Add to favorites
      favorites.push(type);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return { favorites, added: true };
    }

    // Max favorites reached, don't add
    return { favorites, added: false };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { favorites: [], added: false };
  }
}

export async function isFavorite(type: ExerciseType): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.includes(type);
}

export async function setFavorites(types: ExerciseType[]): Promise<void> {
  try {
    const limited = types.slice(0, MAX_FAVORITES);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error setting favorites:', error);
  }
}

export const MAX_EXERCISE_FAVORITES = MAX_FAVORITES;
