const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register/", async (request, response) => {
  console.log(request.body);
  const { username, name, password, gender, location } = request.body;
  console.log(password);
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `SELECT * FROM user
    WHERE username='${username}'`;
  const userDetails = await db.get(getUserQuery);
  switch (true) {
    case userDetails !== undefined:
      response.status(400);
      response.send("User already exists");
      break;
    case password.length < 5:
      response.status(400);
      response.send("Password is too short");
      break;
    case userDetails === undefined && password.length >= 5:
      insertUser = `INSERT INTO user(
                username,name,password
                ,gender,location)VALUES(
                    '${username}','${name}','${hashedPassword}',
                    '${gender}','${location}'
                )
                ;`;
      await db.run(insertUser);
      response.send("User created successfully");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `SELECT * FROM user
    WHERE username='${username}'`;
  const userDetails = await db.get(getUserQuery);
  console.log(userDetails);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCrt = await bcrypt.compare(password, userDetails.password);
    console.log(isPasswordCrt);
    if (isPasswordCrt === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//UPDATE PASSWORD
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  const getUserQuery = `SELECT * FROM user
    WHERE username='${username}'`;
  const userDetails = await db.get(getUserQuery);
  const isPasswordCrt = await bcrypt.compare(oldPassword, userDetails.password);
  if (isPasswordCrt === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      updateUserPassword = `UPDATE user
      SET password='${newHashedPassword}'
      WHERE username = "${username}";`;
      await db.run(updateUserPassword);
      response.send("Password updated");
    }
  }
});

module.exports = app;
