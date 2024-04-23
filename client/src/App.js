import './styles.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route /*, Link*/ } from 'react-router-dom';
import Register from './Register';
import Login from './Login'; 
import HomePage from './HomePage'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<HomePage />} /> 
      </Routes>
    </Router>
  );
}

export default App;

