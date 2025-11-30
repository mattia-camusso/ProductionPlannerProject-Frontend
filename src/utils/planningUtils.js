/**
 * Calculates machine usage based on the current plan and machine definitions.
 * Returns a list of daily usage stats per machine.
 * 
 * @param {Array} plans - List of DemandPlan objects
 * @param {Array} machines - List of Machine objects
 * @returns {Array} - List of usage objects { date, machine_name, machine_class, utilization_percent, ... }
 */
export const calculateMachineUsage = (plans, machines) => {
    if (!plans || plans.length === 0 || !machines || machines.length === 0) {
        return [];
    }

    // 1. Flatten all production orders
    const allOrders = plans.flatMap(p => p.production_orders || []);
    if (allOrders.length === 0) return [];

    // 2. Determine date range
    const startDates = allOrders.map(o => new Date(o.start_date));
    const endDates = allOrders.map(o => new Date(o.end_date));

    if (startDates.length === 0) return [];

    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));

    // Normalize to start of day
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    const usageData = [];
    const currentDate = new Date(minDate);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (d) => d.toISOString().split('T')[0];

    // Map machines for easy lookup
    const machinesMap = new Map(machines.map(m => [m.id, m]));

    // 3. Iterate days
    while (currentDate <= maxDate) {
        const dateStr = formatDate(currentDate);

        // Initialize for all machines
        machines.forEach(machine => {
            usageData.push({
                date: dateStr,
                machine_id: machine.id,
                machine_name: machine.name,
                machine_class: machine.machine_class || 'Uncategorized',
                usage_hours: 0.0,
                capacity_hours: machine.capacity || 10.0, // Default to 10 if not set, though it should be
                utilization_percent: 0.0
            });
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 4. Distribute load
    // We need to replicate the logic: "Greedy allocation" or "Even spread"?
    // The backend logic was:
    // "GREEDY ALLOCATION: Fill available capacity day by day"
    // We will try to replicate that logic to match the backend's previous output.

    // We need to process orders one by one and fill the usageData slots.
    // However, usageData is a flat list. Let's make it a map for faster access: Map<dateStr, Map<machineId, entry>>
    const usageMap = new Map();
    usageData.forEach(entry => {
        if (!usageMap.has(entry.date)) {
            usageMap.set(entry.date, new Map());
        }
        usageMap.get(entry.date).set(entry.machine_id, entry);
    });

    allOrders.forEach(order => {
        if (!order.required_machine_id) return;

        const machine = machinesMap.get(order.required_machine_id);
        if (!machine) return;

        const startDate = new Date(order.start_date);
        const endDate = new Date(order.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        let totalHours = (new Date(order.end_date) - new Date(order.start_date)) / (1000 * 60 * 60);
        let remainingHours = totalHours;
        let currentOrderDate = new Date(startDate);

        while (remainingHours > 0.001 && currentOrderDate <= endDate) {
            const dateStr = formatDate(currentOrderDate);
            const dayMap = usageMap.get(dateStr);

            if (dayMap) {
                const entry = dayMap.get(order.required_machine_id);
                if (entry) {
                    const available = entry.capacity_hours - entry.usage_hours;
                    if (available > 0.001) {
                        const allocate = Math.min(remainingHours, available);
                        entry.usage_hours += allocate;
                        remainingHours -= allocate;
                    }
                }
            }
            currentOrderDate.setDate(currentOrderDate.getDate() + 1);
        }
    });

    // 5. Calculate percentages
    usageData.forEach(entry => {
        if (entry.capacity_hours > 0) {
            entry.utilization_percent = parseFloat(((entry.usage_hours / entry.capacity_hours) * 100).toFixed(1));
        } else {
            entry.utilization_percent = 0;
        }
        // Round usage hours for display
        entry.usage_hours = parseFloat(entry.usage_hours.toFixed(1));
    });

    return usageData;
};
