import React from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Login from './Login/Login';
import Dashboard from './Dashboard/Dashboard';
import { NotFound } from './NotFound/NotFound';
import Registro from './Registro/Registro';
import Perfil from './Perfil/Perfil';
import EditProfile from './EditProfile/EditProfile';
import OtherUser from './OtherUser/OtherUser'; 

export const RouterApp = () => {
    const location = useLocation();
    const validRoutes = ['/', '/dashboard', '/registro', '/profile', '/edit', '/user'];

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/error404" element={<NotFound />} />
            <Route path="/profile" element={<Perfil />} />
            <Route path="/editprofile" element={<EditProfile />} />
            
            {/* Nueva ruta dinámica para perfiles de usuario */}
            <Route path="/user/:userId" element={<OtherUser />} />
            
            {!validRoutes.includes(location.pathname.toLowerCase()) && (
                <Route path="*" element={<Navigate to="/error404" />} />
            )}
        </Routes>
    );
};