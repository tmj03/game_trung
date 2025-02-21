// app.js
const express = require('express');
const { engine } = require('express-handlebars');
const http = require('http');
const socketIo = require('socket.io');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Cấu hình Handlebars với layout mặc định
app.engine('handlebars', engine({
  defaultLayout: 'main', // Sử dụng layout 'main'
}));
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use('/', gameRoutes(io));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
