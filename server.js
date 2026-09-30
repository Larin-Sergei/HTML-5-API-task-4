const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const PORT = 3000;


// ==========================================
// STATIC FILES
// ==========================================

app.use(express.static(path.join(__dirname, "public")));


// ==========================================
// SERVER-SENT EVENTS
// ==========================================

const sseClients = new Set();

app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    const client = res;

    sseClients.add(client);

    res.write(
        `data: ${JSON.stringify({
            type: "connection",
            message: "SSE соединение установлено"
        })}\n\n`
    );

    req.on("close", () => {
        sseClients.delete(client);
    });
});


// Отправка SSE-сообщения всем подключенным клиентам
function sendSSE(data) {
    const message =
        `data: ${JSON.stringify(data)}\n\n`;

    for (const client of sseClients) {
        client.write(message);
    }
}


// Каждые 10 секунд сервер создает новый фейковый пост
let postNumber = 1;

setInterval(() => {

    const post = {
        id: postNumber++,
        title: `Новый пост ${new Date().toLocaleTimeString("ru-RU")}`,
        body: "Это сообщение было отправлено сервером через Server-Sent Events.",
        date: new Date().toLocaleString("ru-RU")
    };

    sendSSE(post);

}, 10000);


// ==========================================
// SOCKET.IO / WEBSOCKET CHAT
// ==========================================

io.on("connection", (socket) => {

    console.log(
        `Пользователь подключился: ${socket.id}`
    );


    socket.emit("systemMessage", {
        text: "Вы подключились к чату.",
        date: new Date().toLocaleTimeString("ru-RU")
    });


    socket.on("chatMessage", (data) => {

        const message = {
            username: data.username || "Аноним",
            text: data.text,
            date: new Date().toLocaleTimeString("ru-RU")
        };

        io.emit("chatMessage", message);
    });


    socket.on("disconnect", () => {

        console.log(
            `Пользователь отключился: ${socket.id}`
        );

    });

});


server.listen(PORT, () => {

    console.log(
        `Сервер запущен: http://localhost:${PORT}`
    );

});