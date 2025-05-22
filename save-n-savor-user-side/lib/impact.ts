import { User } from "@/types/user";

export async function getUserImpact(userId: string) {
  // In a real app, you would fetch from your API
  // const res = await fetch(`/api/impact/${userId}`);
  // return await res.json();
  
  // Mock data - replace with real API calls
  return {
    allTime: {
      ordersPlaced: 24,
      foodSaved: 18.5,
      co2Saved: 37.2,
      moneySaved: 620,
      badges: [
        { name: "Food Rescuer", level: 2, progress: 80 },
        { name: "Eco Warrior", level: 1, progress: 60 },
        { name: "Regular Saver", level: 3, progress: 100 },
      ],
      rank: 128,
      totalUsers: 5280,
    },
    monthly: {
      ordersPlaced: 6,
      foodSaved: 4.2,
      co2Saved: 8.4,
      moneySaved: 150,
      badges: [
        { name: "Food Rescuer", level: 2, progress: 40 },
        { name: "Eco Warrior", level: 1, progress: 30 },
        { name: "Regular Saver", level: 3, progress: 70 },
      ],
      rank: 85,
      totalUsers: 3120,
    },
    weekly: {
      ordersPlaced: 2,
      foodSaved: 1.5,
      co2Saved: 3.0,
      moneySaved: 45,
      badges: [
        { name: "Food Rescuer", level: 2, progress: 20 },
        { name: "Eco Warrior", level: 1, progress: 15 },
        { name: "Regular Saver", level: 3, progress: 25 },
      ],
      rank: 62,
      totalUsers: 1850,
    }
  };
}