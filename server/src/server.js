require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: "*" } });

    const users = {};
    io.on("connection", (socket) => {
      socket.on("register", (userId) => {
        users[userId] = socket.id;
      });
      socket.on("disconnect", () => {
        for (let userId in users) {
          if (users[userId] === socket.id) delete users[userId];
        }
      });
    });

    app.set("io", io);
    app.set("users", users);

    server.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
