//Importerar Node Modules
import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//Importerar data från egna API-källor (mockat från Sportradar)
import haStandings from "./mockData/haStandings.json" assert { type: "json" };
import haLeaders from "./mockData/haLeaders.json" assert { type: "json" };
import haSummaries from "./mockData/haSummaries.json" assert { type: "json" };
import haCountries from "./mockData/haCountries.json" assert { type: "json" };
import shlStandings from "./mockData/shlStandings.json" assert { type: "json" };
import shlLeaders from "./mockData/shlLeaders.json" assert { type: "json" };
import shlSummaries from "./mockData/shlSummaries.json" assert { type: "json" };
import shlCountries from "./mockData/shlCountries.json" assert { type: "json" };

dotenv.config();

const app = express();
const PORT = 5501;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

app.use(cors());
app.use(express.json());

const USERS_FILE_PATH = path.resolve("./mockData/users.json");

const readUsers = () => {
  const data = fs.readFileSync(USERS_FILE_PATH, "utf8");
  return JSON.parse(data);
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf8");
};

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(409).json({ message: "Användarnamn är redan taget" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword };
  users.push(newUser);

  writeUsers(users);
  res.status(201).json({ message: "Användare registrerad!" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(404).json({ message: "Användare ej hittad" });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: "Felaktigt lösenord" });
  }

  const accessToken = jwt.sign({ username: user.username }, ACCESS_TOKEN, {
    expiresIn: "1h",
  });
  res.json({ accessToken });
});

app.patch("/update-user", async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Ingen åtkomst" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    const users = readUsers();

    const user = users.find((u) => u.username === decoded.username);

    if (!user)
      return res.status(404).json({ message: "Användare hittades ej" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(403).json({ message: "Fel lösenord" });

    user.username = newUsername || user.username;
    user.password = await bcrypt.hash(newPassword, 10);

    writeUsers(users);
    res.status(200).json({ message: "Information uppdaterad!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Något gick fel" });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token saknas" });

  jwt.verify(token, ACCESS_TOKEN, (err, user) => {
    if (err) return res.status(403).json({ message: "Ogiltig token" });
    req.user = user;
    next();
  });
}

app.delete("/delete", authenticateToken, (req, res) => {
  const { username } = req.user;
  const users = readUsers();

  const updatedUsers = users.filter((user) => user.username !== username);
  if (updatedUsers.length === users.length) {
    return res.status(404).json({ message: "Användaren hittades inte" });
  }

  writeUsers(updatedUsers);
  res.status(200).json({ message: "Användare borttagen" });
});

//API-Endpoints för mockad data
app.get("/api/standings/ha", (req, res) => {
  res.json(haStandings);
});
app.get("/api/leaders/ha", (req, res) => {
  res.json(haLeaders);
});
app.get("/api/summaries/ha", (req, res) => {
  res.json(haSummaries);
});
app.get("/api/countries/ha", (req, res) => {
  res.json(haCountries);
});
app.get("/api/standings/shl", (req, res) => {
  res.json(shlStandings);
});
app.get("/api/leaders/shl", (req, res) => {
  res.json(shlLeaders);
});
app.get("/api/summaries/shl", (req, res) => {
  res.json(shlSummaries);
});
app.get("/api/countries/shl", (req, res) => {
  res.json(shlCountries);
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
