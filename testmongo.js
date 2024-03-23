const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = "mongodb+srv://caseylaiche:Musicnote4$4$@cluster0.bnthnra.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let usersCollection;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const database = client.db("auth_demo");
        usersCollection = database.collection("users");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToDatabase();

// Default endpoint
app.get('/', (req, res) => {
    const authCookie = req.cookies.auth;

    if (!authCookie) {
        res.send(`
            <h1>Login/Register</h1>
            <form action="/login" method="post">
                <input type="text" name="userID" placeholder="User ID" required><br>
                <input type="password" name="password" placeholder="Password" required><br>
                <button type="submit">Login</button>
            </form>
            <form action="/register" method="post">
                <input type="text" name="userID" placeholder="User ID" required><br>
                <input type="password" name="password" placeholder="Password" required><br>
                <button type="submit">Register</button>
            </form>
            <a href="/cookies">View Active Cookies</a>
        `);
    } else {
        res.send(`
            <h1>Authentication Cookie Exists</h1>
            <p>Cookie Value: ${authCookie}</p>
            <a href="/cookies">View Active Cookies</a>
        `);
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { userID, password } = req.body;
    const user = await usersCollection.findOne({ userID, password });

    if (user) {
        res.cookie('auth', 'authenticated', { maxAge: 60000, httpOnly: true });
        res.redirect('/');
    } else {
        res.send(`
            <h1>Login Failed</h1>
            <p>Invalid credentials. <a href="/">Try Again</a></p>
        `);
    }
});

// Register endpoint
app.post('/register', async (req, res) => {
    const { userID, password } = req.body;
    await usersCollection.insertOne({ userID, password });
    res.send(`
        <h1>Registration Successful</h1>
        <p>User registered successfully. <a href="/">Login</a></p>
    `);
});

// View active cookies endpoint
app.get('/cookies', (req, res) => {
    res.send(`
        <h1>Active Cookies</h1>
        <p>${JSON.stringify(req.cookies)}</p>
        <a href="/clear-cookie">Clear Cookie</a>
        <br>
        <a href="/">Back to Home</a>
    `);
});

// Clear cookie endpoint
app.get('/clear-cookie', (req, res) => {
    res.clearCookie('auth');
    res.send(`
        <h1>Cookie Cleared</h1>
        <p>Authentication cookie has been cleared. <a href="/">Back to Home</a></p>
    `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
