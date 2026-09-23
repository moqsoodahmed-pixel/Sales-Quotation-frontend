import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAudits = createAsyncThunk("audits/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/audits", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load audits"); }
});

export const fetchAudit = createAsyncThunk("audits/fetchOne", async (id, { rejectWithValue }) => {
  try { const res = await api.get(`/audits/${id}`); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load audit"); }
});

export const createAudit = createAsyncThunk("audits/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/audits", data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create audit"); }
});

export const transitionAudit = createAsyncThunk("audits/transition", async ({ id, action, comment, summary }, { rejectWithValue }) => {
  try { const res = await api.post(`/audits/${id}/transition`, { action, comment, summary }); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Transition failed"); }
});

const auditSlice = createSlice({
  name: "audits",
  initialState: { list: [], pagination: {}, current: null, loading: false, error: null },
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAudits.pending, (s) => { s.loading = true; })
      .addCase(fetchAudits.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchAudits.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchAudit.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createAudit.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(transitionAudit.fulfilled, (s, a) => { if (s.current) s.current.status = a.payload.status; });
  },
});

export const { clearCurrent } = auditSlice.actions;
export default auditSlice.reducer;
