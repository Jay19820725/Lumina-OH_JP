import { EnergyWeights } from "../types";

export const apiService = {
  async getUserEnergy(userId: string): Promise<EnergyWeights> {
    const response = await fetch(`/api/energy/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user energy");
    }
    const data = await response.json();
    return {
      Wood: data.wood,
      Fire: data.fire,
      Earth: data.earth,
      Metal: data.metal,
      Water: data.water
    };
  },

  async updateUserEnergy(userId: string, energy: EnergyWeights): Promise<void> {
    const response = await fetch("/api/energy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        wood: energy.Wood,
        fire: energy.Fire,
        earth: energy.Earth,
        metal: energy.Metal,
        water: energy.Water
      })
    });
    if (!response.ok) {
      throw new Error("Failed to update user energy");
    }
  }
};
