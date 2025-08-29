import {app} from "./config/server.js"
import {db} from "./config/db.js"
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import {dbConnection} from "./config/dbMongo.js"
import { ObjectId } from "mongodb"; // Import ObjectId from MongoDB on startup
import { sendResetEmail } from "./services/mailer.js";
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

// Forgot password - generates token and saves it
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        // Search user
        const userRes = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const user = userRes.rows[0];

        // Generate unique token (32 bytes in hex)
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // expires in 15 min

        // Save token
        await db.query(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [user.id_user, token, expiresAt]
        );

        // send email with link to FRONTEND
        await sendResetEmail(user.email, token);

        res.json({ message: "Email sent with instructions" });
    } catch (err) {
        console.error("Error in forgot-password:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Reset password - validate token and update password
app.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        // Search for valid token
        const tokenRes = await db.query(
            "SELECT * FROM public.password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
            [token]
        );

        if (tokenRes.rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const userId = tokenRes.rows[0].user_id;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        await db.query("UPDATE users SET password = $1 WHERE id_user = $2", [
            hashedPassword,
            userId,
        ]);

        // Delete token (already used)
        await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Error in reset-password:", err);
        res.status(500).json({ message: "Server error" });
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
            'SELECT id_recipe, status FROM user_progress WHERE id_user = $1', [id_user]
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

// Initialize user progress with ingredients from Mongo
app.post('/progress/:id_user/:id_recipe/start', async (req, res) => {
    const { id_user, id_recipe } = req.params;

    try {
        // Check if there is already progress
        const { rows: existing } = await db.query(
            `SELECT id_progress FROM user_progress WHERE id_user = $1 AND id_recipe = $2`,
            [id_user, id_recipe]
        );

        let id_progress;
        if (existing.length === 0) {
            // If there is no progress, we create it
            const { rows } = await db.query(
                `INSERT INTO user_progress (id_user, id_recipe, status)
                VALUES ($1, $2, 'in_progress') RETURNING id_progress`, [id_user, id_recipe]
            );
            id_progress = rows[0].id_progress;
        } else {
            id_progress = existing[0].id_progress;
        }

        // Get ingredients from Mongo
        await dbConnection();
        const recipesCollection = mongoose.connection.db.collection('recipes');
        const recipe = await recipesCollection.findOne({ _id: new ObjectId(id_recipe) });

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found in Mongo" });
        }

        // Insert ingredients into Postgres (if they aren't already)
        for (const ing of recipe.ingredients) {
            await db.query(
                `INSERT INTO user_progress_ingredients (id_progress, ingredient_name, is_done)
                VALUES ($1, $2, false)
                ON CONFLICT DO NOTHING`, // in case it already exists
                [id_progress, ing.name]
            );
        }

        res.json({
            message: "Progress initialized successfully",
            id_progress,
            ingredients: recipe.ingredients.map(i => ({ name: i.name, is_done: false }))
        });

    } catch (err) {
        console.error("Error initializing progress:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update ingredients progress
app.put('/progress/:id_user/:id_recipe/ingredient', async (req, res) => {
    const { id_user, id_recipe } = req.params;
    const { ingredient_name, is_done } = req.body;

    try {
        // Find that user's progress for that recipe
        const { rows } = await db.query(
            `SELECT id_progress FROM user_progress WHERE id_user = $1 AND id_recipe = $2`,
            [id_user, id_recipe]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "No progress found for this recipe/user" });
        }

        const id_progress = rows[0].id_progress;

        // Update ingredient status
        const updateRes = await db.query(
            `UPDATE user_progress_ingredients SET is_done = $1
            WHERE id_progress = $2 AND ingredient_name = $3
            RETURNING *`,
            [is_done, id_progress, ingredient_name]
        );

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ message: "Ingredient not found for this progress" });
        }

        res.json({
            message: "Ingredient updated successfully",
            ingredient: updateRes.rows[0]
        });

    } catch (err) {
        console.error("Error updating ingredient progress:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get current progress of a recipe for a user
app.get('/progress/:id_user/:id_recipe', async (req, res) => {
    const { id_user, id_recipe } = req.params;

    try {
        // Search progress in Postgres
        const { rows: progressRows } = await db.query(
            `SELECT up.id_progress, upi.ingredient_name, upi.is_done
            FROM user_progress up
            JOIN user_progress_ingredients upi ON up.id_progress = upi.id_progress
            WHERE up.id_user = $1 AND up.id_recipe = $2`,
            [id_user, id_recipe]
        );

        if (progressRows.length === 0) {
            return res.status(404).json({ message: "No progress found for this user/recipe" });
        }

        const id_progress = progressRows[0].id_progress;

        // Get the recipe from Mongo
        await dbConnection();
        const recipesCollection = mongoose.connection.db.collection('recipes');
        const recipe = await recipesCollection.findOne({ _id: new ObjectId(id_recipe) });

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found in Mongo" });
        }

        // Combining Mongo ingredients with SQL progress
        const ingredients = recipe.ingredients.map(ing => {
            const found = progressRows.find(p => p.ingredient_name === ing.name);
            return {
                name: ing.name,
                quantity: ing.quantity,
                is_done: found ? found.is_done : false
            };
        });

        // Answer
        res.json({
            recipe: {
                _id: recipe._id,
                title: recipe.title,
                description: recipe.description,
                image_url: recipe.image_url,
                steps: recipe.steps  
            },
            id_progress,
            ingredients
        });

    } catch (err) {
        console.error("Error fetching progress:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Mark recipe progress as completed
app.put('/progress/:id_user/:id_recipe/complete', async (req, res) => {
    const { id_user, id_recipe } = req.params;

    try {
        const result = await db.query(
            `UPDATE user_progress 
            SET status = 'completed', completed_at = NOW()
            WHERE id_user = $1 AND id_recipe = $2
            RETURNING *`,
            [id_user, id_recipe]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "No progress found for this recipe/user" });
        }

        res.json({
            message: "Recipe marked as completed",
            progress: result.rows[0]
        });
    } catch (err) {
        console.error("Error completing recipe:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});