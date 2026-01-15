const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Pet = require("./models/Pet");
const AdoptionRequest = require("./models/AdoptionRequest");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Base coordinates (Bangalore, India)
const BASE_LAT = 12.9537754;
const BASE_LNG = 77.7008752;

// Function to calculate new coordinates at a given distance and bearing
const calculateCoordinates = (lat, lng, distanceKm, bearingDeg) => {
    const R = 6371; // Earth's radius in km
    const bearing = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distanceKm / R) +
            Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing),
    );

    const lng2 =
        lng1 +
        Math.atan2(
            Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
            Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2),
        );

    return {
        latitude: (lat2 * 180) / Math.PI,
        longitude: (lng2 * 180) / Math.PI,
    };
};

// City names based on approximate distances from Bangalore
const locationData = {
    2: [
        { city: "Indiranagar", address: "100 Feet Road", bearing: 45 },
        { city: "Koramangala", address: "80 Feet Road", bearing: 135 },
    ],
    5: [
        { city: "Whitefield", address: "ITPL Main Road", bearing: 90 },
        { city: "Electronic City", address: "Phase 1", bearing: 180 },
    ],
    10: [
        { city: "Yelahanka", address: "New Town", bearing: 0 },
        { city: "Bannerghatta", address: "Road Area", bearing: 170 },
    ],
    25: [
        { city: "Hosur", address: "Industrial Area", bearing: 150 },
        { city: "Devanahalli", address: "Airport Road", bearing: 30 },
    ],
    50: [
        { city: "Kolar", address: "Main Road", bearing: 70 },
        { city: "Tumkur", address: "City Center", bearing: 310 },
    ],
    100: [
        { city: "Mysore", address: "Sayyaji Rao Road", bearing: 220 },
        { city: "Vellore", address: "Fort Area", bearing: 110 },
    ],
    200: [
        { city: "Mangalore", address: "Hampankatta", bearing: 260 },
        { city: "Salem", address: "Junction Area", bearing: 130 },
    ],
    500: [
        { city: "Hyderabad", address: "Banjara Hills", bearing: 350 },
        { city: "Chennai", address: "T Nagar", bearing: 100 },
    ],
};

// Sample seed user (based in Bangalore)
const seedUser = {
    name: "NearPaws Shelter",
    email: "shelter@nearpaws.com",
    password: "password123",
    phone: "555-123-4567",
    location: {
        type: "Point",
        coordinates: [BASE_LNG, BASE_LAT], // Bangalore, India
        address: "MG Road",
        city: "Bangalore",
    },
};

// Helper function to get a location at specified distance
const getLocationAtDistance = (distanceKm, index) => {
    const distances = Object.keys(locationData).map(Number);
    const distance = distances[distanceKm % distances.length] || distances[0];
    const locations = locationData[distance];
    const loc = locations[index % locations.length];
    const coords = calculateCoordinates(
        BASE_LAT,
        BASE_LNG,
        distance,
        loc.bearing,
    );
    return {
        type: "Point",
        coordinates: [coords.longitude, coords.latitude],
        address: loc.address,
        city: loc.city,
    };
};

// Sample pets data - 5 pets per category (excluding 'other')
// Pets are spread across different distances from Bangalore
const seedPetsData = [
    // ========== DOGS (5) ==========
    {
        name: "Buddy",
        species: "dog",
        breed: "Golden Retriever",
        age: { value: 3, unit: "years" },
        gender: "male",
        size: "large",
        color: "Golden",
        description:
            "Buddy is a friendly and energetic Golden Retriever who loves to play fetch and go on long walks. He is great with kids and other dogs. House trained and knows basic commands.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 0, // 2km - Indiranagar
        adoptionFee: 150,
        adoptionFeeReason:
            "Rescued from the street. Vet visit for vaccinations, deworming, and general checkup - ₹120. Food and supplies while fostering - ₹30.",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Max",
        species: "dog",
        breed: "German Shepherd",
        age: { value: 4, unit: "years" },
        gender: "male",
        size: "large",
        color: "Black and Tan",
        description:
            "Max is a loyal and intelligent German Shepherd. He is well-trained and would make an excellent companion for an active family. Great with older children.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 2, // 10km - Yelahanka
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "phone",
    },
    {
        name: "Bella",
        species: "dog",
        breed: "Labrador Retriever",
        age: { value: 5, unit: "years" },
        gender: "female",
        size: "large",
        color: "Chocolate",
        description:
            "Bella is a sweet and calm chocolate Lab. She loves swimming and is great with all ages. Very gentle and patient, perfect family dog.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "Mild hip dysplasia, managed with supplements",
        },
        images: [],
        distanceIndex: 3, // 25km - Hosur
        adoptionFee: 175,
        adoptionFeeReason:
            "Found injured on highway. Emergency vet care for hip treatment - ₹150. Monthly supplements for 2 months - ₹25.",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Rocky",
        species: "dog",
        breed: "Boxer",
        age: { value: 2, unit: "years" },
        gender: "male",
        size: "large",
        color: "Brindle",
        description:
            "Rocky is a playful and goofy Boxer who loves to run and play. He has lots of energy and would thrive with an active owner. Great with other dogs!",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 4, // 50km - Kolar
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "phone",
    },
    {
        name: "Daisy",
        species: "dog",
        breed: "Beagle",
        age: { value: 1, unit: "years" },
        gender: "female",
        size: "medium",
        color: "Tricolor",
        description:
            "Daisy is a curious and friendly Beagle puppy. She has an excellent nose and loves to explore. Great with children and other pets.",
        healthInfo: {
            vaccinated: true,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 5, // 100km - Mysore
        adoptionFee: 80,
        adoptionFeeReason:
            "Puppy found abandoned. First round of vaccinations and microchipping - ₹80.",
        status: "available",
        contactPreference: "both",
    },

    // ========== CATS (5) ==========
    {
        name: "Whiskers",
        species: "cat",
        breed: "Maine Coon",
        age: { value: 2, unit: "years" },
        gender: "female",
        size: "medium",
        color: "Gray tabby",
        description:
            "Whiskers is a gentle and affectionate Maine Coon who loves to cuddle. She enjoys sunny spots and playing with feather toys. Perfect for a quiet home.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 1, // 5km - Electronic City
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Luna",
        species: "cat",
        breed: "Siamese",
        age: { value: 1, unit: "years" },
        gender: "female",
        size: "small",
        color: "Cream with dark points",
        description:
            "Luna is a playful and vocal Siamese kitten who loves attention. She is very social and gets along well with other cats. Loves interactive toys!",
        healthInfo: {
            vaccinated: true,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 2, // 10km - Bannerghatta
        adoptionFee: 60,
        adoptionFeeReason:
            "Rescued kitten needed initial vaccinations and flea treatment - ₹60.",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Oliver",
        species: "cat",
        breed: "British Shorthair",
        age: { value: 4, unit: "years" },
        gender: "male",
        size: "medium",
        color: "Blue-gray",
        description:
            "Oliver is a calm and dignified British Shorthair. He enjoys lounging on soft blankets and watching birds from the window. Independent but affectionate.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 3, // 25km - Devanahalli
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Shadow",
        species: "cat",
        breed: "Bombay",
        age: { value: 3, unit: "years" },
        gender: "male",
        size: "medium",
        color: "Black",
        description:
            "Shadow is a sleek and mysterious Bombay cat with stunning copper eyes. He loves to follow his humans around and enjoys cozy laps.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 4, // 50km - Tumkur
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Cleo",
        species: "cat",
        breed: "Persian",
        age: { value: 5, unit: "years" },
        gender: "female",
        size: "medium",
        color: "White",
        description:
            "Cleo is a beautiful Persian with a luxurious white coat. She enjoys a peaceful environment and regular grooming sessions. Very affectionate with her family.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "Requires daily brushing",
        },
        images: [],
        distanceIndex: 5, // 100km - Vellore
        adoptionFee: 100,
        adoptionFeeReason:
            "Surrendered cat needed grooming and dental cleaning - ₹100. Previous owner could no longer care for her.",
        status: "available",
        contactPreference: "both",
    },

    // ========== BIRDS (5) ==========
    {
        name: "Tweety",
        species: "bird",
        breed: "Cockatiel",
        age: { value: 2, unit: "years" },
        gender: "male",
        size: "small",
        color: "Gray with yellow head",
        description:
            "Tweety is a friendly cockatiel who loves to whistle and sing. He can mimic simple tunes and enjoys head scratches. Comes with cage and accessories.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 1, // 5km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Sunny",
        species: "bird",
        breed: "Sun Conure",
        age: { value: 3, unit: "years" },
        gender: "female",
        size: "small",
        color: "Orange and yellow",
        description:
            "Sunny is a vibrant Sun Conure with a playful personality. She loves to dance and can learn tricks. Very social and bonds strongly with her owner.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 2, // 10km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Kiwi",
        species: "bird",
        breed: "Budgerigar",
        age: { value: 1, unit: "years" },
        gender: "male",
        size: "small",
        color: "Green and yellow",
        description:
            "Kiwi is a cheerful budgie who loves to chirp and play with mirrors. Easy to care for and perfect for first-time bird owners. Very active and entertaining.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 3, // 25km
        adoptionFee: 25,
        adoptionFeeReason: "Basic avian vet checkup and wing trim - ₹25.",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Rio",
        species: "bird",
        breed: "Blue and Gold Macaw",
        age: { value: 8, unit: "years" },
        gender: "male",
        size: "large",
        color: "Blue and gold",
        description:
            "Rio is a stunning macaw with a big personality. He can speak several words and loves interaction. Requires experienced bird owner.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 6, // 200km - Mangalore
        adoptionFee: 200,
        adoptionFeeReason:
            "Rescued macaw required specialized avian vet care, blood work, and new cage setup - ₹200. Previous owner passed away.",
        status: "available",
        contactPreference: "phone",
    },
    {
        name: "Pearl",
        species: "bird",
        breed: "African Grey",
        age: { value: 5, unit: "years" },
        gender: "female",
        size: "medium",
        color: "Gray with red tail",
        description:
            "Pearl is an incredibly intelligent African Grey parrot. She has an extensive vocabulary and loves puzzles. Needs mental stimulation and bonding time.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 7, // 500km - Hyderabad
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },

    // ========== RABBITS (5) ==========
    {
        name: "Charlie",
        species: "rabbit",
        breed: "Holland Lop",
        age: { value: 8, unit: "months" },
        gender: "male",
        size: "small",
        color: "White with brown spots",
        description:
            "Charlie is an adorable Holland Lop with floppy ears. He is curious and enjoys exploring. Litter trained and loves fresh vegetables.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 1, // 5km
        adoptionFee: 50,
        adoptionFeeReason: "Neutering surgery and first vet checkup - ₹50.",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Thumper",
        species: "rabbit",
        breed: "Mini Rex",
        age: { value: 1, unit: "years" },
        gender: "male",
        size: "small",
        color: "Black",
        description:
            "Thumper is a soft and velvety Mini Rex with the most amazing fur. He loves to binky around and enjoys chin rubs. Very friendly and social.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 2, // 10km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Snowball",
        species: "rabbit",
        breed: "Lionhead",
        age: { value: 6, unit: "months" },
        gender: "female",
        size: "small",
        color: "White",
        description:
            "Snowball is a fluffy Lionhead rabbit with a gorgeous mane. She is gentle and enjoys being held. Great for families with children.",
        healthInfo: {
            vaccinated: true,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 3, // 25km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Oreo",
        species: "rabbit",
        breed: "Dutch",
        age: { value: 2, unit: "years" },
        gender: "male",
        size: "small",
        color: "Black and white",
        description:
            "Oreo has classic Dutch markings and a wonderful personality. He is very active and loves to run around. Enjoys fresh hay and leafy greens.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 4, // 50km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Hazel",
        species: "rabbit",
        breed: "Flemish Giant",
        age: { value: 3, unit: "years" },
        gender: "female",
        size: "large",
        color: "Sandy brown",
        description:
            "Hazel is a gentle giant Flemish rabbit. Despite her large size, she is very docile and loves to be petted. Needs plenty of space to stretch.",
        healthInfo: {
            vaccinated: true,
            neutered: true,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 5, // 100km
        adoptionFee: 75,
        adoptionFeeReason:
            "Large breed required special enclosure and vet checkup due to size - ₹75.",
        status: "available",
        contactPreference: "phone",
    },

    // ========== HAMSTERS (5) ==========
    {
        name: "Nibbles",
        species: "hamster",
        breed: "Syrian Hamster",
        age: { value: 6, unit: "months" },
        gender: "female",
        size: "small",
        color: "Golden",
        description:
            "Nibbles is an active and curious Syrian hamster. She loves running on her wheel and storing treats in her cheeks. Easy to care for, perfect first pet!",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 1, // 5km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Peanut",
        species: "hamster",
        breed: "Dwarf Campbell",
        age: { value: 4, unit: "months" },
        gender: "male",
        size: "small",
        color: "Gray",
        description:
            "Peanut is a tiny dwarf hamster with lots of energy. He loves to burrow and create tunnels in his bedding. Very entertaining to watch!",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 2, // 10km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Cinnamon",
        species: "hamster",
        breed: "Syrian Hamster",
        age: { value: 8, unit: "months" },
        gender: "female",
        size: "small",
        color: "Cinnamon brown",
        description:
            "Cinnamon is a sweet Syrian hamster who loves treats and attention. She enjoys her exercise ball and is most active in the evening.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 3, // 25km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Whiskey",
        species: "hamster",
        breed: "Roborovski Dwarf",
        age: { value: 5, unit: "months" },
        gender: "male",
        size: "small",
        color: "Brown and white",
        description:
            "Whiskey is the tiniest and fastest hamster youll meet! Robo hamsters are incredibly quick and fun to watch. Best for observation rather than handling.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 4, // 50km
        adoptionFee: 15,
        adoptionFeeReason:
            "Special bedding and wheel setup for this tiny active hamster - ₹15.",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Marshmallow",
        species: "hamster",
        breed: "Winter White",
        age: { value: 7, unit: "months" },
        gender: "female",
        size: "small",
        color: "White with gray stripe",
        description:
            "Marshmallow is a beautiful Winter White hamster. She is calm and enjoys being gently handled. Her coat may change color with the seasons!",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 5, // 100km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },

    // ========== FISH (5) ==========
    {
        name: "Nemo",
        species: "fish",
        breed: "Clownfish",
        age: { value: 1, unit: "years" },
        gender: "male",
        size: "small",
        color: "Orange and white",
        description:
            "Nemo is a vibrant clownfish looking for a saltwater home. He is active and loves swimming through anemones. Requires saltwater aquarium setup.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 1, // 5km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Goldie",
        species: "fish",
        breed: "Fancy Goldfish",
        age: { value: 2, unit: "years" },
        gender: "female",
        size: "small",
        color: "Orange and white",
        description:
            "Goldie is a beautiful fancy goldfish with flowing fins. She is easy to care for and perfect for beginners. Needs a filtered tank with space to swim.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 2, // 10km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Azure",
        species: "fish",
        breed: "Betta Fish",
        age: { value: 1, unit: "years" },
        gender: "male",
        size: "small",
        color: "Blue and purple",
        description:
            "Azure is a stunning male betta with magnificent flowing fins. He has a bold personality and beautiful coloring. Must be kept alone - no other bettas!",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 3, // 25km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Stripe",
        species: "fish",
        breed: "Zebra Danio",
        age: { value: 6, unit: "months" },
        gender: "unknown",
        size: "small",
        color: "Silver with blue stripes",
        description:
            "Stripe is part of a school of active Zebra Danios. These fish are hardy and great for community tanks. Very active swimmers that add movement to any aquarium.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 4, // 50km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Coral",
        species: "fish",
        breed: "Guppy",
        age: { value: 8, unit: "months" },
        gender: "female",
        size: "small",
        color: "Multicolor",
        description:
            "Coral is a colorful guppy with a beautiful tail. Guppies are peaceful community fish that are easy to care for. Perfect for planted aquariums.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 6, // 200km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },

    // ========== TURTLES (5) ==========
    {
        name: "Shelly",
        species: "turtle",
        breed: "Red-Eared Slider",
        age: { value: 3, unit: "years" },
        gender: "female",
        size: "medium",
        color: "Green with red ear patches",
        description:
            "Shelly is a friendly Red-Eared Slider who loves basking under her heat lamp. She enjoys swimming and eating leafy greens. Needs aquatic setup with basking area.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 1, // 5km
        adoptionFee: 30,
        adoptionFeeReason:
            "UVB lamp replacement and water filter for proper care setup - ₹30.",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Tank",
        species: "turtle",
        breed: "Box Turtle",
        age: { value: 8, unit: "years" },
        gender: "male",
        size: "medium",
        color: "Brown and yellow",
        description:
            "Tank is a wise box turtle with beautiful shell patterns. He is terrestrial and enjoys exploring his enclosure. Eats a variety of fruits, veggies, and insects.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 2, // 10km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "phone",
    },
    {
        name: "Mossy",
        species: "turtle",
        breed: "Musk Turtle",
        age: { value: 2, unit: "years" },
        gender: "female",
        size: "small",
        color: "Dark brown",
        description:
            "Mossy is a small musk turtle perfect for those with limited space. She is mostly aquatic and has a feisty personality. Easy to care for once setup is complete.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 3, // 25km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "email",
    },
    {
        name: "Leonardo",
        species: "turtle",
        breed: "Painted Turtle",
        age: { value: 5, unit: "years" },
        gender: "male",
        size: "medium",
        color: "Black with yellow and red markings",
        description:
            "Leonardo is a beautifully colored painted turtle. He is active and loves to swim. His shell has stunning red and yellow patterns along the edges.",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 6, // 200km
        adoptionFee: 40,
        adoptionFeeReason:
            "Found in a park pond. Reptile vet checkup and shell treatment - ₹40.",
        status: "available",
        contactPreference: "both",
    },
    {
        name: "Pebbles",
        species: "turtle",
        breed: "Map Turtle",
        age: { value: 4, unit: "years" },
        gender: "female",
        size: "medium",
        color: "Olive green with intricate patterns",
        description:
            "Pebbles is a map turtle with intricate shell patterns that look like topographic maps. She requires clean water and a good basking spot. Active swimmer!",
        healthInfo: {
            vaccinated: false,
            neutered: false,
            healthConditions: "None",
        },
        images: [],
        distanceIndex: 7, // 500km
        adoptionFee: 0,
        adoptionFeeReason: "",
        status: "available",
        contactPreference: "both",
    },
];

// Generate seedPets with calculated locations
const distances = Object.keys(locationData).map(Number);
const seedPets = seedPetsData.map((pet, index) => {
    const { distanceIndex, ...petData } = pet;
    const distance = distances[distanceIndex % distances.length];
    const locations = locationData[distance];
    const loc = locations[index % locations.length];
    const coords = calculateCoordinates(
        BASE_LAT,
        BASE_LNG,
        distance,
        loc.bearing,
    );

    return {
        ...petData,
        location: {
            type: "Point",
            coordinates: [coords.longitude, coords.latitude],
            address: loc.address,
            city: loc.city,
        },
    };
});

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log("🗑️  Clearing existing data...");
        await User.deleteMany({});
        await Pet.deleteMany({});
        await AdoptionRequest.deleteMany({});

        // Create seed user
        console.log("👤 Creating seed user...");
        const user = await User.create(seedUser);
        console.log(`   Created user: ${user.email}`);

        // Create pets with the owner reference
        console.log("🐾 Creating seed pets...");
        const petsWithOwner = seedPets.map((pet) => ({
            ...pet,
            owner: user._id,
        }));

        const pets = await Pet.insertMany(petsWithOwner);
        console.log(`   Created ${pets.length} pets`);

        // Count pets by species
        const speciesCount = {};
        pets.forEach((pet) => {
            speciesCount[pet.species] = (speciesCount[pet.species] || 0) + 1;
        });

        // Count pets by city (distance)
        const cityCount = {};
        pets.forEach((pet) => {
            const city = pet.location.city;
            cityCount[city] = (cityCount[city] || 0) + 1;
        });

        console.log("\n✅ Database seeded successfully!");
        console.log("\n📋 Summary:");
        console.log(
            `   - 1 user (email: ${seedUser.email}, password: ${seedUser.password})`,
        );
        console.log(
            `   - Location: ${seedUser.location.city}, ${seedUser.location.address}`,
        );
        console.log(`   - ${pets.length} pets available for adoption`);

        console.log("\n🐕 Pets by Species:");
        Object.entries(speciesCount).forEach(([species, count]) => {
            console.log(`   - ${species}: ${count}`);
        });

        console.log("\n📍 Pets by Location (distance from Bangalore):");
        Object.entries(cityCount).forEach(([city, count]) => {
            console.log(`   - ${city}: ${count}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();
