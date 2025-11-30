import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to fetch the current plan
export const fetchPlan = createAsyncThunk(
    'planner/fetchPlan',
    async (token, { rejectWithValue }) => {
        try {
            const response = await fetch('http://localhost:8000/planner/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch current plan');
            }

            const data = await response.json();
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Async thunk to generate a new plan
export const generatePlan = createAsyncThunk(
    'planner/generatePlan',
    async (token, { rejectWithValue }) => {
        try {
            const response = await fetch('http://localhost:8000/planner/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error generating plan');
            }

            const data = await response.json();
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const plannerSlice = createSlice({
    name: 'planner',
    initialState: {
        plans: [],
        loading: false,
        error: null,
        lastGenerated: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Plan
            .addCase(fetchPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload;
                // We don't necessarily update lastGenerated on fetch, or we could if the backend provided a timestamp
            })
            .addCase(fetchPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Generate Plan
            .addCase(generatePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(generatePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload;
                state.lastGenerated = new Date().toISOString();
            })
            .addCase(generatePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = plannerSlice.actions;
export default plannerSlice.reducer;
