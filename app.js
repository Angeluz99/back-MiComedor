const User = require('./models/user');
const Table = require('./models/table');
const Dish = require('./models/dish');
const Restaurant = require('./models/restaurant');


require('dotenv').config();
const bcrypt = require('bcrypt');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// console.log('MongoDB URI:', process.env.MONGODB_URI); 

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, restaurantName, restaurantCode } = req.body;
    
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Check if the restaurant exists
    let restaurant = await Restaurant.findOne({ name: restaurantName });

    if (restaurant) {
      // If the restaurant exists, check if the code matches
      if (restaurant.code !== restaurantCode) {
        return res.status(400).json({ message: 'El restaurante ya existe. El codigo para unirte a él es incorrecto.' });
      }
    } else {
      // Create a new restaurant since it doesn't exist
      restaurant = new Restaurant({
        name: restaurantName,
        code: restaurantCode
      });
      await restaurant.save();

      // Note: The owner field is now optional at creation to avoid circular dependency
      // Consider updating the owner field later or restructuring your logic
    }

    // Now, create the user with the restaurant's ID
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      restaurant: restaurant._id 
    });

    await newUser.save();

    if (!restaurant.owner) {
      restaurant.owner = newUser._id; // Assign the new user as the owner
      await restaurant.save(); // Save the updated restaurant
    }

    res.status(201).json({ message: 'User registered successfully.', userId: newUser._id, restaurantId: restaurant._id });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: error.message });
  }
});



// Log in
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password, restaurantName } = req.body;
    // Find the user and populate restaurant details
    const user = await User.findOne({ username }).populate('restaurant');

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado.' });
    }

    if (user.restaurant.name !== restaurantName) {
      return res.status(401).json({ message: 'Nombre de restaurante incorrecto.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Send back user details along with restaurant name and username
      res.json({
        message: 'Inicio de sesión exitoso',
        userId: user._id,
        username: user.username,
        restaurantId: user.restaurant._id,
        restaurantName: user.restaurant.name
      });
    } else {
      res.status(401).json({ message: 'Contraseña incorrecta.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});





// Post a new table. 
app.post('/api/tables/open', async (req, res) => {
  try {
    const { name, userId, restaurantId } = req.body;

    if (!name.trim()) {
      return res.status(400).json({ message: 'Table name must not be empty.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    // Check for existing table with the same name and open status
    const existingTable = await Table.findOne({ name, restaurant: restaurantId, isOpen: true });
    if (existingTable) {
      return res.status(409).json({ message: 'A table with the same name is already open in this restaurant.' });
    }

    const newTable = new Table({
      name,
      user: userId,
      restaurant: restaurantId
    });

    await newTable.save();
    res.status(201).json(newTable);  // Send the complete table object back to the frontend
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});




// Get all open tables for a specific user
app.get('/api/tables/open/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const tables = await Table.find({ user: req.params.userId, isOpen: true }).populate('dishes');  // Ensure dishes details are included

    if (tables.length === 0) {
      return res.status(200).json({ message: 'No more found.' });
    }

    res.status(200).json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error fetching open tables', error: error.message });
  }
});





// Get all open tables for the restaurant the user belongs to
app.get('/api/tables/restaurant/open/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('restaurant');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!user.restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }
    const tables = await Table.find({ restaurant: user.restaurant._id, isOpen: true })
                              .populate('user', 'username')  // Populating username of the table creator
                              .populate('dishes');  // Also populate the dishes to send their details if needed

    res.status(200).json(tables);
  } catch (error) {
    console.error("Failed to fetch open tables for restaurant:", error);
    res.status(500).json({ message: 'Error fetching open tables', error: error.message });
  }
});


// Fetching closed tables with dish details populated
app.get('/api/tables/restaurant/closed/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('restaurant');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const tables = await Table.find({ restaurant: user.restaurant._id, isOpen: false })
                              .populate('user', 'username')
                              .populate('dishes');  // Ensure dishes are populated

    res.status(200).json(tables);
  } catch (error) {
    console.error("Failed to fetch closed tables:", error);
    res.status(500).send(error.message);
  }
});




// Close a table
app.put('/api/tables/close/:tableId', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.tableId, { isOpen: false, closedAt: new Date() }, { new: true });
    res.status(200).send('Table closed successfully.');
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// DELETE a table by ID
app.delete('/api/tables/:tableId', async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const table = await Table.findByIdAndDelete(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found.' });
    }

    res.status(200).json({ message: 'Table deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// Create a new dish
app.post('/api/dishes', async (req, res) => {
  const { name, price, image, category, restaurantId } = req.body;
  
  try {
      // First, check if the restaurant exists
      const restaurantExists = await Restaurant.findById(restaurantId);
      if (!restaurantExists) {
          return res.status(404).json({ message: "Restaurant not found" });
      }

      // If the restaurant exists, create the new dish
      const newDish = new Dish({
          name,
          price,
          image, // URL to the image
          category,
          restaurant: restaurantId // Associate the dish with the restaurant
      });

      // Save the new dish to the database
      await newDish.save();

      // Respond with the created dish
      res.status(201).json(newDish);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating the dish", error: error.message });
  }
});


//Add a dish to a table
app.put('/api/tables/add-dish/:tableId', async (req, res) => {
  try {
    const { dishId } = req.body;  // ID of the dish to add
    console.log(`Adding Dish ID: ${dishId} to Table ID: ${req.params.tableId}`);

    const table = await Table.findById(req.params.tableId);
    if (!table) {
      console.log('Table not found.');
      return res.status(404).json({ message: 'Table not found.' });
    }

    const dish = await Dish.findById(dishId);
    if (!dish) {
      console.log('Dish not found.');
      return res.status(404).json({ message: 'Dish not found.' });
    }

    // Check if the dish belongs to the same restaurant as the table
    if (dish.restaurant.toString() !== table.restaurant.toString()) {
      console.log('Dish does not belong to the same restaurant as the table.');
      return res.status(400).json({ message: 'Dish does not belong to the same restaurant as the table.' });
    }

    // Add dish to table and update total
    table.dishes.push(dish._id);
    table.total += dish.price;  // Assuming dish.price is a Number
    await table.save();

    // Repopulate dishes to return updated information
    await table.populate('dishes');
    console.log('Dish added successfully.', table);
    res.status(200).json(table);
  } catch (error) {
    console.error("Failed to add dish to table:", error);
    res.status(500).json({ message: 'Error adding dish to table', error: error.message });
  }
});



// Get all dishes of a restaurant
app.get('/api/dishes/restaurant/:restaurantId', async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurant: req.params.restaurantId }).exec();
    res.status(200).json(dishes);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// Delete a dish
app.delete('/api/dishes/:dishId', async (req, res) => {
  try {
    await Dish.findByIdAndDelete(req.params.dishId);
    res.status(200).send('Dish deleted successfully.');
  } catch (error) {
    res.status(500).send(error.message);
  }
});



const port = process.env.PORT || 3001; // This line sets the port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});