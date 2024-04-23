import React, { useState } from 'react';
import { Link } from 'react-router-dom';


function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [restaurantCode, setRestaurantCode] = useState('');


  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          restaurantName: restaurant, // Ensure this matches the backend field
          restaurantCode: restaurantCode, // Include the restaurant code in the request
        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        // Handle success, perhaps redirect to login page or dashboard
      } else if (response.status === 400) {
        const errorData = await response.json();
        alert(errorData.message); // Show an alert to the user
      } else {
        throw new Error('Something went wrong'); // Generic error handling
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed: ' + error.message); // Show an alert to the user
    }
  };

  return (
    <div className='wrapper'>
    <div className='formRegister'>
      <h2>Registro de Usuario</h2>
      <details>
        <summary>¿Cómo funciona?</summary>
      <p>Si el restaurante no ha sido registrado, el código creado se ligará al nuevo restaurante. Si el restaurante ya existe, asegurate de tener el código para poder unirte.</p>
      </details>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nombre de Usuario"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <input
          type="text"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          placeholder="Nombre del Restaurante"
          required
        />
        <input
          type="text"
          value={restaurantCode}
          onChange={(e) => setRestaurantCode(e.target.value)}
          placeholder="Código del Restaurante"
          required
        />
        <button type="submit">Registrar</button>
        <div>
            ¿Ya tienes cuenta? <Link to="/">Entra aquí</Link>
        </div>
      </form>
    </div>
    </div>
  );
}

export default Register;
