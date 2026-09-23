import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchSummary = createAsyncThunk("dashboard/summary", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/dashboard/summary", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load dashboard summary"); }
});

export const fetchQuotationDashboard = createAsyncThunk("dashboard/quotations", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/dashboard/quotations", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load quotation analytics"); }
});

export const fetchCrmDashboard = createAsyncThunk("dashboard/crm", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/dashboard/crm", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load CRM analytics"); }
});

export const fetchIsoDashboard = createAsyncThunk("dashboard/iso", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/dashboard/iso", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load ISO analytics"); }
});

export const fetchTrends = createAsyncThunk("dashboard/trends", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/dashboard/trends", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load trends"); }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: { summary: null, quotations: null, crm: null, iso: null, trends: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSummary.fulfilled, (s, a) => { s.loading = false; s.summary = a.payload.data; })
      .addCase(fetchSummary.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchQuotationDashboard.fulfilled, (s, a) => { s.quotations = a.payload.data; })
      .addCase(fetchCrmDashboard.fulfilled, (s, a) => { s.crm = a.payload.data; })
      .addCase(fetchIsoDashboard.fulfilled, (s, a) => { s.iso = a.payload.data; })
      .addCase(fetchTrends.fulfilled, (s, a) => { s.trends = a.payload; });
  },
});

export default dashboardSlice.reducer;
