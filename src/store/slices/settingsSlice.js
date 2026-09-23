import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchSettings = createAsyncThunk("settings/fetchSettings", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/settings");
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load settings"); }
});

export const updateSettings = createAsyncThunk("settings/updateSettings", async (data, { rejectWithValue }) => {
  try {
    const res = await api.put("/settings", data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update settings"); }
});

const settingsSlice = createSlice({
  name: "settings",
  initialState: { data: null, loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSettings.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; })
      .addCase(fetchSettings.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(updateSettings.pending, (s) => { s.saving = true; })
      .addCase(updateSettings.fulfilled, (s, a) => { s.saving = false; s.data = a.payload; })
      .addCase(updateSettings.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
  },
});

export default settingsSlice.reducer;
