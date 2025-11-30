import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchMachines = createAsyncThunk(
    'machines/fetchMachines',
    async (token, { rejectWithValue }) => {
        try {
            const response = await fetch('http://localhost:8000/machines/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch machines');
            }
            const data = await response.json();
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const machinesSlice = createSlice({
    name: 'machines',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMachines.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMachines.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchMachines.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default machinesSlice.reducer;
