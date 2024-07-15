const axios = require('axios');
const io = require("socket.io")(3000, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

// Keep track of connected sockets and their current data type
const clients = {};

io.on('connection', (socket) => {
    console.log('A user connected.');

    let interval = null;

    const fetchData = async (type) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/output-monitorings/${type}`);
            const data = response.data.data;

            // Sum outputs by lineName
            const summedData = data.reduce((acc, item) => {
                if (!acc[item.lineName]) {
                    acc[item.lineName] = { lineName: item.lineName, output: 0 };
                }
                acc[item.lineName].output += Number(item.output); // Ensure output is treated as a number
                return acc;
            }, {});
            
            const processedData = Object.values(summedData);

            socket.emit('update', { type, data: processedData }); // Send update to the current socket (user)
            console.log(`Emitted ${type} data to the current client`);

            // Emit update to all sockets in the current data type room
            io.to(type).emit('update', { type, data: processedData });
            console.log(`Emitted ${type} data to all clients in ${type} room`);
        } catch (error) {
            console.error('Error fetching data from backend:', error);
        }
    };

    socket.on('fetchData', (type) => {
        console.log(`Received fetchData event with type: ${type}`);

        if (interval) {
            clearInterval(interval);
            interval = null;
        }

        fetchData(type);

        // Leave the previous room (if any) and join the new room
        if (clients[socket.id]) {
            socket.leave(clients[socket.id]);
        }
        socket.join(type);
        clients[socket.id] = type; // Store current data type for this socket
    });

    socket.on('disconnect', () => {
        console.log('User disconnected.');
        clearInterval(interval);
        // Remove socket from clients object on disconnect
        delete clients[socket.id];
    });

    // Listen for successful add event
    socket.on('addSuccess', async (type) => {
        try {
            // Fetch updated data for the added type
            await fetchData(type);

            // If the added type is DIP, also fetch and emit updated data for SMT
            if (type === 'DIP') {
                await fetchData('SMT');
            } else if (type === 'SMT') {
                await fetchData('DIP');
            }
        } catch (error) {
            console.error('Error updating data after add operation:', error);
        }
    });
});

console.log('Server is running on port 3000');
