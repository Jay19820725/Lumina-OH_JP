import { FiveElementValues, FiveElement } from "../core/types";

export const apiService = {
  async getUserEnergy(userId: string): Promise<FiveElementValues> {
    const response = await fetch(`/api/energy/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user energy");
    }
    const data = await response.json();
    return {
      [FiveElement.WOOD]: data.wood,
      [FiveElement.FIRE]: data.fire,
      [FiveElement.EARTH]: data.earth,
      [FiveElement.METAL]: data.metal,
      [FiveElement.WATER]: data.water
    };
  },

  async updateUserEnergy(userId: string, energy: FiveElementValues): Promise<void> {
    const response = await fetch("/api/energy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        wood: energy[FiveElement.WOOD],
        fire: energy[FiveElement.FIRE],
        earth: energy[FiveElement.EARTH],
        metal: energy[FiveElement.METAL],
        water: energy[FiveElement.WATER]
      })
    });
    if (!response.ok) {
      throw new Error("Failed to update user energy");
    }
  }
};
