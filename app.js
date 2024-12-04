const express = require("express")
const { Server } = require("http")
const app = express()
const path = require("path")
const http = require("http")

const socketio = require("socket.io")

const server = http.createServer(app);

const io = socketio(server)

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

io.on("connection",function (socket){
    socket.on("send-location",function (data){
        io.emit("receive-location",{id:socket.id, ...data})
    });
    // console.log("connected");
    socket.on("disconnect",()=>{
        io.on("user-disconnected",socket.id);
    })
})

app.get("/",(req,res)=>{
    res.render("index")
})

server.listen(0, () => {
    const address = server.address(); // Get server address information
    console.log(`Server running at http://localhost:${address.port}`);
});