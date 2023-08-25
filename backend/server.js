import express from "express";
import pooll from "./src/db.js";
import cors from "cors";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import bcrypt from 'bcrypt';
import dotenv from "dotenv";
dotenv.config();

const app = express();

const port =  5000;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

function createSlug(fullName) {
    return `${fullName.toLowerCase().replace(/[\s]+/g, "-")}-${uuidv4().slice(0, 8)}`;
}


app.get("/wallet/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
      const userResult = await pooll.query("SELECT id FROM Users WHERE slug = $1", [slug]);
      
      if (userResult.rows.length === 0) {
          return res.status(404).send("User not found.");
      }

      const userId = userResult.rows[0].id;
      const walletResult = await pooll.query("SELECT wallet_address FROM Wallets WHERE user_id = $1", [userId]);

      if (walletResult.rows.length === 0) {
          return res.status(404).send("Wallet not found.");
      }

      const walletAddress = walletResult.rows[0].wallet_address;
      res.send({ walletAddress });

  } catch (error) {
      console.error("Error fetching wallet address:", error);
      res.status(500).send("Internal server error.");
  }
});

app.post("/invite", async (req, res) => {
  const email = req.body.email;
  const token = uuidv4();

  await pooll.query("INSERT INTO Invitations (email, token) VALUES ($1, $2)", [email, token]);

  let transporter = nodemailer.createTransport({
    service: "outlook",
    auth: {
      user: "odogwuOnitsha404@outlook.com",
      pass: "odogwu442",
    },
  });

  let mailOptions = {
    from: "odogwuOnitsha404@outlook.com",
    to: email,
    subject: "Invitation to Register on IvoryPay",
    html: `<a href='http://localhost:3000/register/${token}'>Click here to register</a>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error is here .... " + error);
    } else {
      console.log("Email Sent ✅ " + info.response);
    }
  });

  res.send("Invitation sent!");
});



app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).send("Email and password are required.");
  }

  try {
      const userResult = await pooll.query("SELECT id, password, slug FROM Users WHERE email = $1", [email]);

      if (userResult.rows.length === 0) {
          return res.status(404).send("User not found.");
      }

      const user = userResult.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
          return res.status(401).send("Invalid password.");
      }

      res.send({
          message: "Logged in successfully!",
          slug: user.slug
      });
  } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send("Internal server error.");
  }
});



// app.post("/register", async (req, res) => {
//   const { email, password, fullName, token } = req.body;
//   const result = await pooll.query("SELECT * FROM Invitations WHERE email = $1 AND token = $2", [email, token]);
//   console.log(result.rows);

//   if (result.rows.length === 0) {
//       return res.status(400).send("Invalid token or email.");
//   }

//   try {
//       const saltRounds = 10;
//       const hashedPassword = await bcrypt.hash(password, saltRounds);
//       const userSlug = createSlug(fullName);

//       // Setting initial balance to 10 instead of 0
//       const initialBalance = 10;

//       const userInsertResult = await pooll.query(
//           "INSERT INTO Users (email, password, full_name, balance, slug) VALUES ($1, $2, $3, $4, $5) RETURNING id",
//           [email, hashedPassword, fullName, initialBalance, userSlug]
//       );

//       const userId = userInsertResult.rows[0].id;
//       const walletAddress = uuidv4();  // Generating a unique wallet address using UUID

//       await pooll.query("INSERT INTO Wallets (user_id, wallet_address) VALUES ($1, $2)", [userId, walletAddress]);
//       await pooll.query("DELETE FROM Invitations WHERE token = $1", [token]);

//       // Returning both slug and wallet address for the user's reference
//       res.send({ 
//           message: "Registered successfully and wallet with unique address created!",
//           slug: userSlug,
//           walletAddress: walletAddress  // Added this line
//       });

//   } catch (error) {
//       console.error("Error during registration:", error);
//       res.status(500).send("Internal server error.");
//   }
// });


app.post("/register", async (req, res) => {
  const { email, password, fullName, token, adminSecret } = req.body;  // Add adminSecret

  console.log(`Received email: ${email}, token: ${token}`);
  console.log(`Admin secret == entered by user ${adminSecret}`)
  console.log(`admin secret from environment variable ${process.env.ADMIN_SECRET}`)

  const result = await pooll.query("SELECT * FROM Invitations WHERE email = $1 AND token = $2", [email, token]);

      // Log the result of the query for debugging
      console.log(`Query result:`, result.rows);

  if (result.rows.length === 0) {
      return res.status(400).send("Invalid token or email.");
  }

  try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const userSlug = createSlug(fullName);
      const initialBalance = 10;

      let role;


      const ADMIN_SECRETi = process.env.ADMIN_SECRET;  // Use an environment variable for the admin secret code
      if (adminSecret == ADMIN_SECRETi) {
          role = "admin";
      } else {
        role = "user";
      }

      console.log(`assigned role ${role}`);

      const userInsertResult = await pooll.query(
          "INSERT INTO Users (email, password, full_name, balance, slug, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
          [email, hashedPassword, fullName, initialBalance, userSlug, role]
      );

      const userId = userInsertResult.rows[0].id;
      const walletAddress = uuidv4();  // Generating a unique wallet address using UUID

      await pooll.query("INSERT INTO Wallets (user_id, wallet_address) VALUES ($1, $2)", [userId, walletAddress]);
      await pooll.query("DELETE FROM Invitations WHERE token = $1", [token]);

      // Returning both slug and wallet address for the user's reference
      res.send({ 
        message: "Registered successfully and wallet with a unique address created!",
        slug: userSlug,
        role: role, 
        walletAddress: walletAddress
    });

  } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).send("Internal server error.");
  }
});

app.get("/admin/list-users", async (req, res) => {
  try {
    const users = await pooll.query("SELECT id, email, full_name, role, is_active FROM Users");
    res.send({ users: users.rows });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).send("Internal server error.");
  }
});

// 2. Invite Users:
app.post("/admin/invite-user", async (req, res) => {
  const { email } = req.body;
  const token = uuidv4();  // Generating a unique token using UUID

  try {
    await pooll.query("INSERT INTO Invitations (email, token) VALUES ($1, $2)", [email, token]);
    // TODO: Send an actual email to the invited user using the token.

    let transporter = nodemailer.createTransport({
      service: "outlook",
      auth: {
        user: "odogwuOnitsha404@outlook.com",
        pass: "odogwu442",
      },
    });
  
    let mailOptions = {
      from: "odogwuOnitsha404@outlook.com",
      to: email,
      subject: "Invitation to Register on IvoryPay",
      html: `<a href='http://localhost:3000/register/${token}'>Click here to register</a>`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error is here .... " + error);
      } else {
        console.log("Email Sent ✅ " + info.response);
      }
    });

    
    res.send({ message: "Invitation sent successfully!", token: token });
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).send("Internal server error.");
  }
});


app.post("/admin/toggle-user-status", async (req, res) => {
  const { userId, status } = req.body;

  if (!["enabled", "disabled"].includes(status)) {
    return res.status(400).send("Invalid status provided.");
  }

  // Convert the string status to a boolean is_active value
  const is_active = status === "enabled";

  try {
    // Use the is_active value to update the Users table
    await pooll.query("UPDATE Users SET is_active=$1 WHERE id=$2", [is_active, userId]);
    res.send({ message: `User ${status} successfully!` });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).send("Internal server error.");
  }
});





app.get("/user/balance/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
      const result = await pooll.query("SELECT balance FROM Users WHERE slug = $1", [slug]);

      if (result.rows.length === 0) {
          return res.status(404).send("User not found.");
      }

      const userBalance = result.rows[0].balance;
      res.send({ balance: userBalance });

  } catch (error) {
      console.error("Error fetching user balance:", error);
      res.status(500).send("Internal server error.");
  }
});




app.post("/sendTokens", async (req, res) => {
  const { senderSlug, recipientWalletAddress, amount } = req.body;

  // Validation of data...
  if (!senderSlug || !recipientWalletAddress || !amount) {
      return res.status(400).send("Missing required fields.");
  }

  try {
      // Check if sender exists using slug
      const senderResult = await pooll.query("SELECT * FROM Users WHERE slug = $1", [senderSlug]);

      if (!senderResult.rows[0]) {
          return res.status(404).send("Sender not found.");
      }

      // Check if the sender is disabled
      if (senderResult.rows[0].is_active === 'false') {
          return res.status(403).send("User is disabled and cannot send tokens.");
      }

      // Check if recipient exists using wallet address
      const recipientResult = await pooll.query("SELECT user_id FROM Wallets WHERE wallet_address = $1", [recipientWalletAddress]);
      if (recipientResult.rows.length === 0) {
          return res.status(404).send("Recipient not found.");
      }
      const recipientId = recipientResult.rows[0].user_id;

      // Ensure sender has enough balance
      const senderBalance = senderResult.rows[0].balance;
      if (senderBalance < amount) {
          return res.status(400).send("Insufficient balance.");
      }

      // Deduct from sender and add to recipient
      await pooll.query("UPDATE Users SET balance = balance - $1 WHERE slug = $2", [amount, senderSlug]);
      await pooll.query("UPDATE Users SET balance = balance + $1 WHERE id = $2", [amount, recipientId]);

      res.send("Tokens sent successfully.");

  } catch (error) {
      console.error("Error during sending tokens:", error);
      res.status(500).send("Internal server error.");
  }
});

app.get("/reset-db", async (req, res) => {
  try {
      await pooll.query("DELETE FROM Wallets");
      await pooll.query("DELETE FROM Users");
      await pooll.query("DELETE FROM Invitations");
      res.send("Database reset successfully!");
  } catch (error) {
      console.error("Error resetting database:", error);
      res.status(500).send("Internal server error.");
  }
});

app.get('/user/info/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
      const results = await pooll.query('SELECT full_name, role FROM users WHERE slug = $1', [slug]);

      if (results.rows.length === 0) {
          return res.status(404).json({ message: 'User not found.' });
      }

      const user = results.rows[0];
      res.json({ name: user.name, role: user.role });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error.' });
  }
});




app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
