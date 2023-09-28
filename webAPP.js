const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
var serviceAccount = require("./Key.json");
const bcrypt = require('bcrypt'); // Import the bcrypt library

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/signup', (req, res) => {
  res.render('pages/signup');
})

app.post('/signupsubmit', async (req, res) => { // Change to async function
  const username = req.body.username;
  const email = req.body.email;
  const plainPassword = req.body.password; // Rename to plainPassword for clarity

  try {
    // Check if the email already exists in the database
    const emailSnapshot = await db.collection('userData').where('email', '==', email).get();
    if (!emailSnapshot.empty) {
      // Email already exists, handle the duplication error (e.g., render an error page)
      return res.render('pages/signup-error', { message: 'Email already exists. Please use a different email.' });
    }

    // Hash the user's password
    const saltRounds = 10; // You can adjust the number of salt rounds for security
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Store the hashed password in the database
    await db.collection('userData').add({
      username: username,
      email: email,
      password: hashedPassword, // Store the hashed password
    });

    // Redirect to a success page or take other actions
    res.render('pages/spell');
  } catch (error) {
    // Handle any registration errors here
    console.error(error);
    res.render('pages/signup-error', { message: 'An error occurred during registration. Please try again.' });
  }
});

app.get('/login', (req, res) => {
  res.render('pages/login');
})

app.post('/loginsubmit', async (req, res) => {
  const email = req.body.email;
  const plainPassword = req.body.password; // Rename to plainPassword for clarity

  try {
    // Retrieve user data based on the provided email
    const querySnapshot = await db.collection('userData').where('email', '==', email).get();

    if (!querySnapshot.empty) {
      // Get the first document (assuming emails are unique)
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(plainPassword, userData.password);

      if (passwordMatch) {
        // Passwords match, redirect to the 'spell' page
        res.render('pages/spell');
      } else {
        // Passwords do not match, render an error page or send an error message
        res.render('pages/login-error', { message: 'Incorrect password. Please try again.' });
      }
    } else {
      // No user with the provided email was found, render an error page or send an error message
      res.render('pages/login-error', { message: 'No user found with this email address.' });
    }
  } catch (error) {
    // Handle any login errors here
    console.error(error);
    res.render('pages/login-error', { message: 'An error occurred during login. Please try again.' });
  }
});

app.get('/logout', (req, res) => {
  // Perform any necessary logout actions (e.g., clearing session data)
  // Then redirect to the login page
  res.redirect('/login');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})







