export const currentUser = {
  id: "u-1042",
  name: "Aarav Mehta",
  email: "aarav.mehta@example.com",
  phone: "+91 98765 43210",
  role: "driver", // driver | passenger — user can act as both
  avatar: "https://i.pravatar.cc/150?img=12",
  rating: 4.8,
  ridesGiven: 132,
  ridesTaken: 21,
  memberSince: "2024-02-11",
  verified: true,
  vehicle: {
    make: "Hyundai",
    model: "i20",
    color: "Polar White",
    plate: "MP 04 AB 7231",
    seats: 4,
  },
  bio: "Product designer commuting between Arera Colony and DB City every weekday. Music, no smoking, AC on.",
};

export const reviews = [
  { id: "rv-1", author: "Sanya Kapoor", avatar: "https://i.pravatar.cc/100?img=32", rating: 5, comment: "Punctual and the car was spotless. Would ride again.", date: "2026-06-21" },
  { id: "rv-2", author: "Rohan Iyer", avatar: "https://i.pravatar.cc/100?img=51", rating: 5, comment: "Great conversation, smooth driving, on time both ways.", date: "2026-06-14" },
  { id: "rv-3", author: "Priya Nair", avatar: "https://i.pravatar.cc/100?img=45", rating: 4, comment: "Good ride overall, pickup point was a short walk.", date: "2026-05-30" },
];
