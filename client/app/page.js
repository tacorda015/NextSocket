'use client'
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import * as echarts from 'echarts';

export default function Home() {
    const [socket, setSocket] = useState(null);
    const [dataSMT, setDataSMT] = useState([]);
    const [dataDIP, setDataDIP] = useState([]);
    const [dataType, setDataType] = useState('SMT');
    const [chart, setChart] = useState(null);
    const [output, setOutput] = useState('');
    const [lineName, setLineName] = useState('');

    useEffect(() => {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        newSocket.on('update', ({ type, data }) => {
            console.log('Received update from WebSocket:', type, data);
            if (type === 'SMT') {
                setDataSMT(data); // Update SMT data state when new data arrives
            } else if (type === 'DIP') {
                setDataDIP(data); // Update DIP data state when new data arrives
            }
        });

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        const chartInstance = echarts.init(document.getElementById('chart-container'));
        setChart(chartInstance);

        window.addEventListener('resize', () => {
            chartInstance.resize();
        });

        return () => {
            chartInstance.dispose();
        };
    }, []);

    useEffect(() => {
        if (!chart) return;

        const option = {
            xAxis: {
                type: 'category',
                data: dataType === 'SMT' ? dataSMT.map(item => item.date) : dataDIP.map(item => item.date),
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: dataType === 'SMT' ? dataSMT.map(item => item.output) : dataDIP.map(item => item.output),
                type: 'bar'
            }]
        };
        chart.setOption(option); // Update chart with new data

    }, [dataSMT, dataDIP, chart, dataType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { output: Number(output), lineName };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/output-monitorings/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            socket.emit('addSuccess', dataType);

            setOutput('');
            setLineName('');

        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleButtonClick = (type) => {
        setDataType(type);
        socket.emit('fetchData', type);
    };

    return (
        <div className="h-screen">
            <div className="flex flex-col">
                <div className="mt-4">
                    <h2 className="text-lg font-bold">Output Monitoring Data</h2>

                    <form className="w-full max-w-sm" onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="output">
                                Output
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="output"
                                type="number"
                                placeholder="output"
                                value={output}
                                onChange={(e) => setOutput(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lineName">
                                Line Name
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="lineName"
                                type="text"
                                placeholder="lineName"
                                value={lineName}
                                onChange={(e) => setLineName(e.target.value)}
                            />
                        </div>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            type="submit"
                        >
                            Submit
                        </button>
                    </form>

                    <div className="flex gap-4 mt-2 mb-4">
                        <button
                            className={`px-4 py-2 rounded ${dataType === 'SMT' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => handleButtonClick('SMT')}
                        >
                            SMT
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${dataType === 'DIP' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => handleButtonClick('DIP')}
                        >
                            DIP
                        </button>
                    </div>
                    <div id="chart-container" style={{ height: '400px' }}></div>
                </div>
            </div>
        </div>
    );
}
