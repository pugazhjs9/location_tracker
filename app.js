require("dotenv").config(); // For environment variables
const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Helper function to fetch weather data
const fetchWeather = async (latitude, longitude) => {
    try {
        const apiKey = process.env.WEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
        const response = await axios.get(url);
        return {
            temperature: response.data.main.temp,
            description: response.data.weather[0].description,
            city: response.data.name,
        };
    } catch (error) {
        console.error("Error fetching weather data:", error.message);
        return null;
    }
};

// WebSocket Handlers
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("send-location", async (data) => {
        if (data.latitude && data.longitude) {
            const weather = await fetchWeather(data.latitude, data.longitude);
            io.emit("receive-location", { id: socket.id, ...data, weather });
        } else {
            socket.emit("error", "Invalid location data received.");
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        io.emit("user-disconnected", socket.id);
    });
});

// Routes
app.get("/", (req, res) => {
    res.render("index");
});

// Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
