import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchEngagements = createAsyncThunk("isoEngagements/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/iso-engagements", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load engagements"); }
});

export const fetchEngagement = createAsyncThunk("isoEngagements/fetchOne", async (id, { rejectWithValue }) => {
  try { const res = await api.get(`/iso-engagements/${id}`); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load engagement"); }
});

export const fetchDashboard = createAsyncThunk("isoEngagements/dashboard", async (id, { rejectWithValue }) => {
  try { const res = await api.get(`/iso-engagements/${id}/dashboard`); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load dashboard"); }
});

export const fetchEngagementHistory = createAsyncThunk("isoEngagements/history", async (id, { rejectWithValue }) => {
  try { const res = await api.get(`/iso-engagements/${id}/history`); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load history"); }
});

export const createEngagement = createAsyncThunk("isoEngagements/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/iso-engagements", data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create engagement"); }
});

export const updateEngagement = createAsyncThunk("isoEngagements/update", async ({ id, data }, { rejectWithValue }) => {
  try { const res = await api.patch(`/iso-engagements/${id}`, data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update engagement"); }
});

export const transitionEngagement = createAsyncThunk("isoEngagements/transition", async ({ id, action, comment }, { rejectWithValue }) => {
  try { const res = await api.post(`/iso-engagements/${id}/transition`, { action, comment }); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Transition failed"); }
});

const isoEngagementSlice = createSlice({
  name: "isoEngagements",
  initialState: { list: [], pagination: {}, current: null, dashboard: null, history: [], loading: false, error: null },
  reducers: { clearCurrent: (s) => { s.current = null; s.dashboard = null; s.history = []; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEngagements.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchEngagements.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchEngagements.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchEngagement.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(fetchDashboard.fulfilled, (s, a) => { s.dashboard = a.payload; })
      .addCase(fetchEngagementHistory.fulfilled, (s, a) => { s.history = a.payload; })
      .addCase(createEngagement.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateEngagement.fulfilled, (s, a) => { if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload }; })
      .addCase(transitionEngagement.fulfilled, (s, a) => { if (s.current) s.current.status = a.payload.status; });
  },
});

export const { clearCurrent } = isoEngagementSlice.actions;
export default isoEngagementSlice.reducer;
