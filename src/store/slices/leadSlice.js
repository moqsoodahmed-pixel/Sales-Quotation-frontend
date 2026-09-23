import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchLeads = createAsyncThunk("leads/fetch", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/leads", { params });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load leads"); }
});

export const fetchLead = createAsyncThunk("leads/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/leads/${id}`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load lead"); }
});

export const createLead = createAsyncThunk("leads/create", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/leads", data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create lead"); }
});

export const updateLead = createAsyncThunk("leads/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/leads/${id}`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update lead"); }
});

export const archiveLead = createAsyncThunk("leads/archive", async (id, { rejectWithValue }) => {
  try { await api.delete(`/leads/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to archive lead"); }
});

export const convertLead = createAsyncThunk("leads/convert", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/leads/${id}/convert`, data || {});
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to convert lead"); }
});

export const createEnquiryFromLead = createAsyncThunk("leads/createEnquiry", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/leads/${id}/enquiry`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create enquiry"); }
});

const leadSlice = createSlice({
  name: "leads",
  initialState: { list: [], pagination: {}, current: null, loading: false, error: null },
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLeads.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchLeads.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchLead.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createLead.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateLead.fulfilled, (s, a) => {
        const i = s.list.findIndex((l) => l._id === a.payload._id);
        if (i >= 0) s.list[i] = a.payload;
        if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload };
      })
      .addCase(archiveLead.fulfilled, (s, a) => { s.list = s.list.filter((l) => l._id !== a.payload); })
      .addCase(convertLead.fulfilled, (s, a) => {
        const i = s.list.findIndex((l) => l._id === a.payload.lead._id);
        if (i >= 0) s.list[i] = a.payload.lead;
      });
  },
});

export const { clearCurrent } = leadSlice.actions;
export default leadSlice.reducer;
