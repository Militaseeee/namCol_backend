import {app} from "./config/server.js"
import {db} from "./config/db.js"
import mongoose from "mongoose";

import {dbConnection} from "./config/dbMongo.js"

// Get all employees
app.get('/users', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json(err);
    }
});


// MongoDB: get all recipes
app.get('/recipes', async (req, res) => {
    
    try {
        await dbConnection(); // secure connection
        
        const recipesCollection = mongoose.connection.db.collection("recipes");
        
        const recipes = await recipesCollection.find({}).toArray()
        
        res.status(200).json(recipes);

    } catch (err) {
        res.status(500).json(err);
    }
});