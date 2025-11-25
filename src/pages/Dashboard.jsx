import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const Dashboard = () => {
    const [usageData, setUsageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
        const fetchUsageData = async () => {
            try {
                const response = await fetch('http://localhost:8000/planner/machine-usage');
                if (!response.ok) {
                    throw new Error('Failed to fetch machine usage data');
                }
                const data = await response.json();
                setUsageData(data);
            } catch (err) {
                console.error("Error fetching usage data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsageData();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading dashboard data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    // Extract unique machines and classes
    const machinesMap = new Map(); // name -> class
    const classesSet = new Set();

    usageData.forEach(item => {
        machinesMap.set(item.machine_name, item.machine_class || 'Uncategorized');
        classesSet.add(item.machine_class || 'Uncategorized');
    });

    const uniqueClasses = Array.from(classesSet).sort();
    const uniqueMachines = Array.from(machinesMap.keys()).sort();

    // Filter data based on selection
    let filteredMachines = uniqueMachines;
    if (selectedFilter !== 'all') {
        if (selectedFilter.startsWith('class:')) {
            const className = selectedFilter.split(':')[1];
            filteredMachines = uniqueMachines.filter(m => machinesMap.get(m) === className);
        } else if (selectedFilter.startsWith('machine:')) {
            const machineName = selectedFilter.split(':')[1];
            filteredMachines = [machineName];
        }
    }

    // Prepare Chart Data
    const chartData = [];

    usageData.forEach(item => {
        if (!filteredMachines.includes(item.machine_name)) return;

        let dateEntry = chartData.find(d => d.date === item.date);
        if (!dateEntry) {
            dateEntry = { date: item.date };
            chartData.push(dateEntry);
        }
        dateEntry[item.machine_name] = item.utilization_percent;
    });

    // Sort by date
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Extended vibrant color palette
    const colors = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#6366F1', // Indigo
        '#14B8A6', // Teal
        '#F97316', // Orange
        '#06B6D4', // Cyan
    ];

    const handleRefresh = () => {
        setLoading(true);
        setError(null);
        // Re-fetch
        const fetchUsageData = async () => {
            try {
                const response = await fetch('http://localhost:8000/planner/machine-usage');
                if (!response.ok) {
                    throw new Error('Failed to fetch machine usage data');
                }
                const data = await response.json();
                setUsageData(data);
            } catch (err) {
                console.error("Error fetching usage data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsageData();
    };

    // Calculate Aggregated Stats for the Table
    const machineStats = {};

    usageData.forEach(item => {
        if (!filteredMachines.includes(item.machine_name)) return;

        if (!machineStats[item.machine_name]) {
            machineStats[item.machine_name] = {
                name: item.machine_name,
                class: item.machine_class || 'Uncategorized',
                totalUtilization: 0,
                count: 0,
                peak: 0,
                totalHours: 0
            };
        }

        machineStats[item.machine_name].totalUtilization += item.utilization_percent;
        machineStats[item.machine_name].count += 1;
        machineStats[item.machine_name].totalHours += item.usage_hours;
        if (item.utilization_percent > machineStats[item.machine_name].peak) {
            machineStats[item.machine_name].peak = item.utilization_percent;
        }
    });

    const aggregatedData = Object.values(machineStats).map(stat => ({
        ...stat,
        average: stat.count > 0 ? (stat.totalUtilization / stat.count).toFixed(1) : 0,
        peak: stat.peak.toFixed(1),
        totalHours: stat.totalHours.toFixed(1)
    })).sort((a, b) => b.average - a.average); // Sort by highest average utilization

    // Import LineChart components
    // Note: We need to make sure we import LineChart, Line, etc. at the top. 
    // Since I can't easily change imports in this block, I will assume the user (me) will fix imports or I should have done it in a separate block.
    // Wait, I can't change imports here easily if they are at the top of the file and I'm editing the body.
    // I will use a multi-replace to fix imports as well.

    return (
        <div className="page-container">
            <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                            Machine Utilization Dashboard
                        </h1>
                        <p className="text-slate-600 text-lg">Real-time production capacity monitoring</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {/* Filter Selector */}
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="inline-select"
                            style={{ minWidth: '200px' }}
                        >
                            <option value="all">📊 All Machines</option>
                            <optgroup label="By Machine Class">
                                {uniqueClasses.map(cls => (
                                    <option key={`class:${cls}`} value={`class:${cls}`}>🏭 {cls}</option>
                                ))}
                            </optgroup>
                            <optgroup label="By Individual Machine">
                                {uniqueMachines.map(name => (
                                    <option key={`machine:${name}`} value={`machine:${name}`}>⚙️ {name}</option>
                                ))}
                            </optgroup>
                        </select>

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chart Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8 backdrop-blur-sm bg-white/90">
                <div className="flex items-center gap-3 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Utilization Trends</h2>
                        <p className="text-slate-500">Daily capacity usage over time</p>
                    </div>
                </div>

                <div style={{ width: '100%', height: '500px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                            <defs>
                                {filteredMachines.map((name, index) => {
                                    const color = colors[uniqueMachines.indexOf(name) % colors.length];
                                    return (
                                        <linearGradient key={`gradient-${name}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    );
                                })}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                                dataKey="date"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                                stroke="#CBD5E1"
                            />
                            <YAxis
                                label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', fill: '#475569', fontWeight: 600 }}
                                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                                stroke="#CBD5E1"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                    borderRadius: '12px',
                                    border: '2px solid #E2E8F0',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                    padding: '12px 16px'
                                }}
                                labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '8px' }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="circle"
                            />
                            <ReferenceLine
                                y={100}
                                label={{ value: "100% Capacity", position: "right", fill: "#DC2626", fontSize: 12, fontWeight: 600 }}
                                stroke="#DC2626"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                            />
                            {filteredMachines.map((name, index) => (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={colors[uniqueMachines.indexOf(name) % colors.length]}
                                    strokeWidth={3}
                                    dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 2 }}
                                    animationDuration={1500}
                                    animationEasing="ease-in-out"
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Performance Summary Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 backdrop-blur-sm bg-white/90">
                <div className="flex items-center gap-3 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Performance Summary</h2>
                        <p className="text-slate-500">Average machine utilization metrics</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border-2 border-slate-200 shadow-sm">
                    <table className="min-w-full divide-y-2 divide-slate-200">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Machine</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Avg Utilization</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Peak Utilization</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Total Hours</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {aggregatedData.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className="hover:bg-blue-50/50 transition-colors duration-150"
                                >
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                                <span className="text-white font-bold text-sm">⚙️</span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900">{item.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 shadow-sm">
                                            {item.class}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${item.average >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                        item.average >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                                            'bg-gradient-to-r from-blue-500 to-indigo-500'
                                                        }`}
                                                    style={{ width: `${Math.min(item.average, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-lg shadow-sm min-w-[70px] justify-center ${item.average >= 90 ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800' :
                                                item.average >= 70 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800' :
                                                    'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800'
                                                }`}>
                                                {item.average}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-slate-700">{item.peak}%</span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-slate-700">{item.totalHours}h</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
