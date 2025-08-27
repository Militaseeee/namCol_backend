# namCol_backend

This repository contains the backend development for ÑamCol, an interactive platform designed to promote Colombian gastronomy.
It provides the REST API that supports the frontend application, enabling users to explore, learn, and prepare traditional Colombian recipes.

## 📁 Project Structure
```
namCol_backend/
├── config/
│   ├── db.js
│   ├── dbMongo.js
│   └── server.js
├── .env              
├── .gitignore
├── app.js    
├── package-lock.json
├── package.json
└── README.md
```

---

## 🚀 Features

- User management (registration, login, profile).
- Authentication with hashed passwords (using **bcrypt**).
- Recipe management with a hybrid database model:
  - **PostgreSQL** for structured data (users, progress, transactions).
  - **MongoDB** for unstructured data (recipes, ingredients, steps).
- User progress tracking (completed and in-progress recipes).
- Secure and scalable API built with **Node.js + Express**.

---

## 🛠️ Tech Stack

- **Node.js** with **Express.js**
- **PostgreSQL** (relational data)
- **MongoDB** (non-relational data)
- **bcrypt** (password hashing)
- **REST API** architecture

---

## 🔧 Configuration and Installation

1) Clone the repository
```powershell
git clone https://github.com/Militaseeee/namCol_backend.git
cd namCol_backend
```

2) Install the dependencies
```powershell
npm install
```

3) Main dependencies and their purpose
```js
import express, { json } from 'express';
import pkg from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import fs from 'fs';
```

- express → Framework for creating the server and handling HTTP routes.
- pg → Client for connecting to PostgreSQL.
- cors → Allows requests from other domains (e.g., your frontend) to this server.
- bcrypt → Encryption and secure comparison of passwords.
- dotenv → Loads environment variables from a `.env` file.
- mongoose → ODM for working with MongoDB in Node.js.
- fs → Native Node.js module for file management (read, write, delete).

4) Configure environment variables in a file `.env`

This project includes `/.env` in `.gitignore`, Therefore, it's not uploaded to GitHub. You must create it locally with the following content. Important: Don't use quotes around values ​​(e.g., DB_NAME=postgres).

``` sql
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_USER=postgres.user
DB_PASSWORD=password
DB_NAME=postgres
DB_PORT=6543
```

``` sql
DB_MONGO=mongodb+srv://user:password@cluster.mongodb.net/namcol
```

5) Start the Server
```powershell
node app.js
```

Server available by default in: http://localhost:3000

---

## 📡 Main endpoints
    
#### 👤 Users

- **POST** `/register` → Register user.
- **POST** `/login` → Login with email and password.
- **GET** `/profile/:id_user` → Get profile with progress.
- **PUT** `/user/:id_user/password` → Update password.
- **DELETE** `/user/:id_user` → Delete user.

#### 🍽️ Recipes

- **GET** `/recipes` → List all recipes.
- **GET** `/recipe/:id` → Get details of a prescription.

---

## ❓ Troubleshooting
- MySQL Connection Error:
	- Check the variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` in your `.env`.
	- Make sure the PostgreSQL service is up and the port is accessible (default 6543).
    - If you are using Supabase or a remote server, check that SSL is enabled. (ssl: { rejectUnauthorized: false }).
	- Create the base manually if it doesn't exist.

- MongoDB Connection Error:
  - Verify that the variable `DB_MONGO` is correctly set in your `.env`.
  - If using **MongoDB Atlas**, make sure your IP address is whitelisted in the **Network Access** panel.
  - Check that the username and password in your connection string are correct and properly URL-encoded (e.g., special characters like `@` should be replaced with `%40`).
  - Ensure the cluster is active and accepting connections.
  - If you get `MongoServerSelectionError`, try adding `?retryWrites=true&w=majority` at the end of your connection string.


---