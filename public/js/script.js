const socket = io();

// Request location updates
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error("Error fetching location:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
} else {
    alert("Geolocation is not supported by your browser.");
}

// Initialize the map
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors",
}).addTo(map);

const markers = {};
const weatherPanel = document.getElementById("weather-panel");

// Receive location updates
socket.on("receive-location", (data) => {
    const { id, latitude, longitude, weather } = data;

    // Update or create marker
    if (!markers[id]) {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    } else {
        markers[id].setLatLng([latitude, longitude]);
    }

    // Update marker tooltip
    const tooltipContent = `
        <b>User ID:</b> ${id}<br>
        <b>City:</b> ${weather?.city || "Unknown"}<br>
        <b>Weather:</b> ${weather?.description || "N/A"}<br>
        <b>Temperature:</b> ${weather?.temperature || "N/A"}°C
    `;
    markers[id].bindTooltip(tooltipContent).openTooltip();

    // Update weather panel
    updateWeatherPanel(id, weather?.city, latitude, longitude, weather?.description, weather?.temperature);
});

// Remove marker on disconnection
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

// Update weather panel
function updateWeatherPanel(id, city, latitude, longitude, description, temperature) {
    const userElement = document.getElementById(`user-${id}`);
    const content = `
        <div><b>User ID:</b> ${id}</div>
        <div><b>City:</b> ${city || "Unknown"}</div>
        <div><b>Coordinates:</b> ${latitude}, ${longitude}</div>
        <div><b>Weather:</b> ${description || "N/A"}</div>
        <div><b>Temperature:</b> ${temperature || "N/A"}°C</div>
    `;
    if (userElement) {
        userElement.innerHTML = content;
    } else {
        const newElement = document.createElement("div");
        newElement.id = `user-${id}`;
        newElement.classList.add("user-info");
        newElement.innerHTML = content;
        weatherPanel.appendChild(newElement);
    }
}
