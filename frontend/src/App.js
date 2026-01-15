import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import BrowsePets from "./pages/BrowsePets";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostPet from "./pages/PostPet";
import PetDetails from "./pages/PetDetails";
import MyPets from "./pages/MyPets";
import AdoptionRequests from "./pages/AdoptionRequests";
import "./App.css";

function App() {
    return (
        <div className="App">
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/browse" element={<BrowsePets />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/pets/:id" element={<PetDetails />} />
                    <Route
                        path="/post-pet"
                        element={
                            <ProtectedRoute>
                                <PostPet />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-pets"
                        element={
                            <ProtectedRoute>
                                <MyPets />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/adoption-requests"
                        element={
                            <ProtectedRoute>
                                <AdoptionRequests />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}

export default App;
