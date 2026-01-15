# 🐾 NearPaws - Location-Based Pet Adoption Platform

NearPaws is a web application that connects pet owners looking to rehome their pets with potential adopters in their local area. Using location-based search, adopters can discover pets available for adoption within their chosen distance radius.

## Features

### For Pet Owners
- **Post Pet Listings**: Share details about pets available for adoption including photos, description, health information, and more
- **Manage Listings**: Update pet status (available, pending, adopted) and delete listings
- **Receive Adoption Requests**: Get notified when someone is interested in adopting your pet
- **Accept/Reject Requests**: Review and respond to adoption requests

### For Adopters
- **Location-Based Discovery**: Find pets available for adoption near you
- **Distance Filter**: Set your preferred search radius (5km to 200km)
- **Species Filter**: Filter by pet type (dogs, cats, birds, rabbits, etc.)
- **Send Adoption Requests**: Express interest in a pet with a personalized message
- **Track Requests**: Monitor the status of your sent adoption requests

## Tech Stack

### Frontend
- React.js (Create React App)
- React Router v6 (Navigation)
- Axios (HTTP client)
- CSS3 with CSS Variables (Styling)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer (File uploads)
- Express Validator

## Project Structure

```
NearPaws/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js   # Authentication logic
│   │   │   ├── petController.js    # Pet CRUD operations
│   │   │   └── adoptionController.js # Adoption requests
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT authentication
│   │   │   └── upload.js          # Image upload handling
│   │   ├── models/
│   │   │   ├── User.js            # User schema
│   │   │   ├── Pet.js             # Pet schema with geospatial
│   │   │   └── AdoptionRequest.js # Adoption request schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── petRoutes.js
│   │   │   └── adoptionRoutes.js
│   │   └── server.js              # Express app entry point
│   ├── uploads/                    # Uploaded images
│   ├── .env                       # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js          # Navigation bar
│   │   │   ├── PetCard.js         # Pet listing card
│   │   │   ├── LocationFilter.js  # Distance selector
│   │   │   ├── SpeciesFilter.js   # Pet type filter
│   │   │   └── ProtectedRoute.js  # Auth wrapper
│   │   ├── context/
│   │   │   ├── AuthContext.js     # Authentication state
│   │   │   └── LocationContext.js # Location state
│   │   ├── pages/
│   │   │   ├── Home.js            # Main pet listing page
│   │   │   ├── Login.js           # Login page
│   │   │   ├── Register.js        # Registration page
│   │   │   ├── PostPet.js         # Create pet listing
│   │   │   ├── PetDetails.js      # Single pet view
│   │   │   ├── MyPets.js          # User's pet listings
│   │   │   └── AdoptionRequests.js # Manage requests
│   │   ├── services/
│   │   │   └── api.js             # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd NearPaws
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Backend Environment**
   
   Edit `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/nearpaws
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRE=7d
   ```

4. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Configure Frontend Environment**
   
   Edit `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

3. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   The app will open at `http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Pets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pets` | Get all pets (with filters) |
| GET | `/api/pets/nearby` | Get pets near location |
| GET | `/api/pets/:id` | Get single pet |
| POST | `/api/pets` | Create pet listing |
| PUT | `/api/pets/:id` | Update pet |
| PATCH | `/api/pets/:id/status` | Update pet status |
| DELETE | `/api/pets/:id` | Delete pet |
| GET | `/api/pets/user/my-pets` | Get user's pets |

### Adoption Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/adoptions` | Create adoption request |
| GET | `/api/adoptions/received` | Get received requests |
| GET | `/api/adoptions/sent` | Get sent requests |
| PATCH | `/api/adoptions/:id/status` | Accept/reject request |
| DELETE | `/api/adoptions/:id` | Withdraw request |

## Location-Based Search

The application uses MongoDB's geospatial queries (2dsphere index) to find pets within a specified distance from the user's location.

**Query Parameters for `/api/pets/nearby`:**
- `latitude` - User's latitude
- `longitude` - User's longitude
- `distance` - Search radius in kilometers (default: 50)
- `species` - Filter by pet species
- `status` - Filter by adoption status

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
