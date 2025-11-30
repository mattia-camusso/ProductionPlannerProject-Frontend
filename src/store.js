import { configureStore } from '@reduxjs/toolkit';
import plannerReducer from './features/planner/plannerSlice';
import machinesReducer from './features/machines/machinesSlice';

export const store = configureStore({
    reducer: {
        planner: plannerReducer,
        machines: machinesReducer,
    },
});
