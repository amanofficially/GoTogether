# 🚗 GoTogether

GoTogether is a **MERN Stack Ride-Sharing Platform** that connects drivers and passengers for **car and bike rides**. Users can offer rides, search for available rides, book seats, chat in real-time, and share travel costs through a secure, modern, and responsive web application.

---

## ✨ Features

### 👤 Authentication
- Secure JWT Authentication
- Email OTP Verification
- Login & Signup
- Forgot & Reset Password
- Protected Routes
- Automatic Access Token Refresh

### 🚗 Ride Management
- Offer Car & Bike Rides
- Search Available Rides
- Book Seats
- Manage Ride Requests
- Ride Details
- Ride History

### 💬 Real-Time Communication
- Socket.io Powered Ride Chat
- Live Messaging Between Driver & Passenger

### 👨‍💼 User Dashboard
- Passenger Dashboard
- Driver Dashboard
- Booking Management
- Notifications
- Profile Management
- Change Password
- Delete Account

### 📍 Smart Route System
- Address Geocoding
- Route Distance & Duration Estimation
- OpenStreetMap (Nominatim) Integration

### 📱 UI/UX
- Fully Responsive Design
- Modern Dashboard
- Clean User Experience
- Professional Dark Theme
- Reusable Components

---

# 🛠 Tech Stack

## Frontend
- React 19
- Vite
- Tailwind CSS v4
- React Router DOM v7
- React Hook Form
- Axios
- Socket.io Client
- React Icons

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Nodemailer
- Socket.io

---

# 📂 Project Structure

```
GoTogether/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── App.jsx
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── sockets/
│   ├── config/
│   └── server.js
│
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/yourusername/GoTogether.git

cd GoTogether
```

---

## Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd ../server
npm install
```

---

## Environment Variables

Create a `.env` file inside the **server** folder.

```env
PORT=5000

MONGO_URI=your_mongodb_connection

CLIENT_URL=http://localhost:5173

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

COOKIE_REFRESH_NAME=gt_refresh_token

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

# ▶️ Run Project

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:5000
```

---

# 🔐 Authentication Flow

- User Registration
- Email OTP Verification
- Login
- Access Token stored in memory
- Refresh Token stored in HTTP-only Cookie
- Silent Token Refresh
- Automatic Logout on Invalid Session

---

# 📄 Available Pages

| Route | Description |
|---------|-------------|
| `/` | Home |
| `/about` | About |
| `/features` | Features |
| `/contact` | Contact |
| `/login` | Login |
| `/signup` | Register |
| `/forgot-password` | Reset Password |
| `/search-ride` | Search Ride |
| `/offer-ride` | Offer Ride |
| `/ride/:id` | Ride Details |
| `/dashboard/passenger` | Passenger Dashboard |
| `/dashboard/driver` | Driver Dashboard |
| `/bookings` | Bookings |
| `/ride-history` | Ride History |
| `/notifications` | Notifications |
| `/profile` | User Profile |
| `/settings` | Settings |

---

# 🌟 Core Modules

- User Authentication
- Email Verification
- Ride Search
- Ride Booking
- Ride Offering
- Driver Dashboard
- Passenger Dashboard
- Real-Time Chat
- Notifications
- Profile Management
- Booking History

---

# 🔄 API Integration

The frontend communicates with the backend using dedicated service files.

```
src/services/

authService.js
userService.js
rideService.js
bookingService.js
notificationService.js
ratingService.js
chatService.js
```

Axios handles:

- Access Token
- Refresh Token
- Automatic Retry
- Error Handling

---

# 📍 Maps & Geocoding

Current implementation uses:

- OpenStreetMap
- Nominatim API

Future improvements:

- Google Maps
- Mapbox
- Live GPS Tracking
- Interactive Maps

---

# 🎯 Future Enhancements

- Live Ride Tracking
- Online Payments
- Driver Ratings
- Passenger Ratings
- AI Ride Matching
- SOS Emergency Feature
- Ride Scheduling
- Push Notifications
- Multi-language Support
- Admin Dashboard
- Mobile App (React Native)

---

# 📸 Screenshots

> Add screenshots of your application here.

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push changes

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Aman Patel**

Frontend Developer | MERN Stack Developer

---

## ⭐ Support

If you like this project, don't forget to **Star ⭐ the repository**.
