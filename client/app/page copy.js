"use client"
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [data, setData] = useState([]);
  const [dataType, setDataType] = useState('smt'); // Default to 'smt' data

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    // Function to handle incoming data updates from the WebSocket
    newSocket.on('update', (newData) => {
      setData(newData);
    });

    return () => newSocket.close(); // Clean up the socket connection on unmount
  }, []);

  // Function to handle button click and send 'fetchData' event to server
  const handleButtonClick = (type) => {
    setDataType(type);
    socket.emit('fetchData', type); // Emit 'fetchData' event with selected type
  };

  return (
    <div className="h-screen">
      <div className="flex flex-col">
        <div className="mt-4">
          <h2 className="text-lg font-bold">Output Monitoring Data</h2>
          <div className="flex space-x-4 mt-2">
            <button onClick={() => handleButtonClick('smt')} className={`px-4 py-2 rounded ${dataType === 'smt' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>SMT</button>
            <button onClick={() => handleButtonClick('dip')} className={`px-4 py-2 rounded ${dataType === 'dip' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>DIP</button>
          </div>
          <p>Data Length: {data.length}</p>
          {data.map((item) => (
            <div key={item.id} className="border rounded px-4 py-2 my-2">
              <p>ID: {item.id}</p>
              <p>Date: {item.date}</p>
              <p>Output: {item.output}</p>
              <p>Line Name: {item.lineName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
