import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import format from 'date-fns/format';

function HomePage() {
  const location = useLocation();
  const { userId, restaurantId, username, restaurantName } = location.state || {};
  const [openTables, setOpenTables] = useState([]);
  const [closedTables, setClosedTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableName, setTableName] = useState('');
  const [viewMode, setViewMode] = useState('myTables'); // 'myTables', 'openTables', 'closedTables'

  useEffect(() => {
    const fetchTables = async () => {
      setIsLoading(true);
      let endpoint = '';
      switch (viewMode) {
        case 'openTables':
          endpoint = `/api/tables/restaurant/open/${userId}`;
          break;
        case 'closedTables':
          endpoint = `/api/tables/restaurant/closed/${userId}`;
          break;
        default:
          endpoint = `/api/tables/open/${userId}`;
          break;
      }

      try {
        const response = await fetch(endpoint, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) { // Check if data is an array
            if (viewMode === 'closedTables') {
              setClosedTables(data);
            } else {
              setOpenTables(data);
            }
          } else {
            setError(data.message || "No tables found");
          }
        } else {
          const errorMsg = await response.text();
          setError('Failed to load tables: ' + errorMsg);
        }
      } catch (error) {
        setError('Failed to load tables: ' + error.message);
        console.error('Error fetching tables:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchTables();
    }
  }, [userId, viewMode]);

  const handleNewTable = async (event) => {
    event.preventDefault();
    if (!tableName.trim()) {
      alert('Please enter a valid table name.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/tables/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tableName, userId, restaurantId })
      });
      if (response.ok) {
        const newTable = await response.json();
        setOpenTables(prevTables => [...prevTables, newTable]); // Always expecting newTable to be valid
        setTableName(''); // Clear the input field
      } else {
        const errorMsg = await response.text();
        throw new Error('Failed to open new table: ' + errorMsg);
      }
    } catch (error) {
      setError('Failed to open new table: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeTable = async (tableId) => {
    try {
      const response = await fetch(`/api/tables/close/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const updatedTables = openTables.filter(table => table._id !== tableId);
        setOpenTables(updatedTables);  // Update the state to reflect the table has been closed
      } else {
        const errorMsg = await response.text();
        throw new Error('Failed to close table: ' + errorMsg);
      }
    } catch (error) {
      setError('Failed to close table: ' + error.message);
      console.error('Error closing table:', error);
    }
  };

  function displayTables(tables, mode) {
    if (!tables.length) {
      return <p>No hay mesas.</p>; // Show a message if no tables
    }
  
    return (
      <ul>
        {tables.map(table => (
          <li key={table._id}>
            <h4>{table.name} - Opened at: {format(new Date(table.openedAt), 'PPPpp')}</h4>
            {mode !== 'myTables' && <p>Created by: {table.user?.username}</p>}
            {table.dishes && table.dishes.length > 0 ? (
              <ul>
                {table.dishes.map(dish => (
                  <li key={dish._id}>{dish.name} - ${dish.price ? dish.price.toFixed(2) : "0.00"}</li>
                ))}
              </ul>
            ) : <p>No dishes added yet.</p>}
            <p>Total: ${table.total ? table.total.toFixed(2) : "0.00"}</p>
            {mode === 'myTables' && <button onClick={() => closeTable(table._id)}>Close Table</button>}
          </li>
        ))}
      </ul>
    );
  }
  
  
  return (
    <div className='homePage'>
      <header>
        <h4><span>MiComedor</span></h4>
        <h3><span>{restaurantName}</span></h3>
        <h5>Usuario: <span>{username}</span></h5>
        <section><Link to="/">CERRAR SESIÓN</Link></section>
      </header>
      <nav>
        <div onClick={() => setViewMode('myTables')}>MIS MESAS</div>
        <div>PLATILLOS</div>
        <div onClick={() => setViewMode('openTables')}>MESAS ABIERTAS</div>
        <div onClick={() => setViewMode('closedTables')}>MESAS CERRADAS</div>
      </nav>
      <main>
        {viewMode === 'myTables' && (
          <form onSubmit={handleNewTable}>
            <input
              type="text"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              placeholder="New Table Name"
              required
            />
            <button type="submit">Create New Table</button>
          </form>
        )}
        {isLoading ? <p>Loading...</p> : (
          viewMode === 'closedTables' ? displayTables(closedTables, viewMode) : displayTables(openTables, viewMode)
        )}
        {error && <p>{error}</p>}
      </main>
      <aside>
      </aside>
      <footer>
        <ul>
          <li>PREGUNTAS FRECUENTES</li>
          <li>COMO FUNCIONA MICOMEDOR</li>
          <li>INTERESADO EN UN SISTEMA PERSONALIZADO? CONTACTA A LOS DESARROLLADORES</li>
        </ul>
      </footer>
    </div>
  );
}

export default HomePage;
