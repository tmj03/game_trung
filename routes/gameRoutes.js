// routes/gameRoutes.js
const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

module.exports = (io) => {
    router.get('/', gameController.index);

    // Socket.IO setup for game events
    io.on('connection', (socket) => {
        console.log('New player connected');

        socket.on('playerMove', (data) => {
            socket.broadcast.emit('playerMoved', data);
        });

        socket.on('bulletFired', (bullet) => {
            socket.broadcast.emit('bulletFired', bullet);
        });

        socket.on('disconnect', () => {
            console.log('Player disconnected');
        });
    });

    return router;
};
