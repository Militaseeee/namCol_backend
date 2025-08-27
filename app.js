import {app} from "./config/server.js"
import {db} from "./config/db.js"
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import {dbConnection} from "./config/dbMongo.js"
import { ObjectId } from "mongodb"; // Import ObjectId from MongoDB on startup
import crypto from "crypto";

// ================================
//     --- POSTGRES QUERIES ---
// ================================

// Get all employees
app.get('/users', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Path to register new users with hash
app.post('/register', async (req, res) => {
    const { name, email, password, country } = req.body;

    try {
        // Check if it already exists
        const exist = await db.query(
            'SELECT * FROM users WHERE email = $1', 
            [email]
        );

        if (exist.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate hash
        const hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.query(
            'INSERT INTO users (name, email, password, country) VALUES ($1, $2, $3, $4) RETURNING id_user, name, email, country',
            [name, email, hash, country]
        );

        res.status(201).json({
            message: 'User successfully registered',
            user: result.rows[0],
        });
    } catch (err) {

        console.error(err);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login path
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Search user by email
        const userRes = await db.query(
            'SELECT * FROM users WHERE email = $1', [email]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ mensaje: 'User not found' });
        }

        const user = userRes.rows[0];

        // Compare passwords
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Answer
        res.status(200).json({
            message: 'Login successful',
            user: {
                id_user: user.id_user,
                name: user.name,
                email: user.email,
                country: user.country,
            },
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ mensaje: 'Server error' });
    }
});

// Update user
app.put('/user/:id_user/password', async (req, res) => {
    const { id_user } = req.params;
    const { newPassword } = req.body;

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Run the update
        const result = await db.query(
            'UPDATE users SET password = $1 WHERE id_user = $2',
            [hashedPassword, id_user]
        );

        // Validate if the user was found
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
app.delete('/user/:id_user', async (req, res) => {
    const { id_user } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM users WHERE id_user = $1',
            [id_user]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ================================
//      --- MONGO QUERIES ---
// ================================

// MongoDB: get all recipes
app.get('/recipes', async (req, res) => {
    
    try {
        await dbConnection(); // secure connection
        
        const recipesCollection = mongoose.connection.db.collection('recipes');
        
        const recipes = await recipesCollection.find({}).toArray()
        
        res.status(200).json(recipes);

    } catch (err) {
        res.status(500).json(err);
    }
});

// Get profile info: completed and unfinished recipes
app.get('/profile/:id_user', async (req, res) => {
    const { id_user } = req.params;

    try {
        // Check user progress in Postgres
        const { rows: progress } = await db.query(
            'SELECT id_recipe, status FROM user_progress WHERE id_user = $1',[id_user]
        );

        if (progress.length === 0) {
            return res.json({
                completedRecipes: [],
                unfinishedRecipes: []
            });
        }

        // Connect to Mongo and get recipes
        await dbConnection();
        const recipesCollection = mongoose.connection.db.collection('recipes');

        // separate IDs by state
        const completedIds = progress.filter(p => p.status === 'completed').map(p => p.id_recipe);
        const inProgressIds = progress.filter(p => p.status === 'in_progress').map(p => p.id_recipe);

        // Convert to ObjectId before querying in Mongo
        const completedRecipes = await recipesCollection
            .find({ _id: { $in: completedIds.map(id => new ObjectId(id)) } })
            .toArray();

        const unfinishedRecipes = await recipesCollection
            .find({ _id: { $in: inProgressIds.map(id => new ObjectId(id)) } })
            .toArray();

        // Answer
        res.json({
            completedRecipes,
            unfinishedRecipes
        });

    } catch (err) {
        console.error(' Error loading profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
