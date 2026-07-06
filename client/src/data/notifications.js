export const notifications = [
  { id: "n1", type: "booking", title: "Seat request from Ishita Verma", body: "1 seat requested for GT-2291 · Arera Colony → DB City Mall", time: "12 min ago", read: false },
  { id: "n2", type: "reminder", title: "Ride starts in 2 hours", body: "GT-2291 departs 08:15 AM from Arera Colony", time: "1 hr ago", read: false },
  { id: "n3", type: "review", title: "New rating received", body: "Sanya Kapoor rated your ride 5 stars", time: "Yesterday", read: true },
  { id: "n4", type: "system", title: "Verify your driving licence", body: "Complete verification to unlock more daily ride offers", time: "2 days ago", read: true },
  { id: "n5", type: "booking", title: "Booking confirmed", body: "Your seat on GT-2292 is confirmed for tomorrow, 08:45 AM", time: "3 days ago", read: true },
];

export const messages = [
  { id: "m1", rideId: "GT-2291", from: "Ishita Verma", avatar: "https://i.pravatar.cc/100?img=25", text: "Hi! Can you pick me up near the Bittan Market bus stop?", time: "09:12 AM", mine: false },
  { id: "m2", rideId: "GT-2291", from: "You", text: "Sure, I'll be there by 8:22. Look for the white i20.", time: "09:14 AM", mine: true },
];
