import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FiveElementValues, FiveElement } from "../core/types";

export const apiService = {
  async getUserEnergy(userId: string): Promise<FiveElementValues> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.energy) {
          return {
            [FiveElement.WOOD]: data.energy.wood || 0,
            [FiveElement.FIRE]: data.energy.fire || 0,
            [FiveElement.EARTH]: data.energy.earth || 0,
            [FiveElement.METAL]: data.energy.metal || 0,
            [FiveElement.WATER]: data.energy.water || 0
          };
        }
      }
      
      // Default values if not found
      return {
        [FiveElement.WOOD]: 0,
        [FiveElement.FIRE]: 0,
        [FiveElement.EARTH]: 0,
        [FiveElement.METAL]: 0,
        [FiveElement.WATER]: 0
      };
    } catch (error) {
      console.error("Error fetching user energy from Firestore:", error);
      throw error;
    }
  },

  async updateUserEnergy(userId: string, energy: FiveElementValues): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        energy: {
          wood: energy[FiveElement.WOOD],
          fire: energy[FiveElement.FIRE],
          earth: energy[FiveElement.EARTH],
          metal: energy[FiveElement.METAL],
          water: energy[FiveElement.WATER]
        }
      });
    } catch (error) {
      console.error("Error updating user energy in Firestore:", error);
      throw error;
    }
  }
};
