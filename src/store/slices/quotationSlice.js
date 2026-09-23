import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchQuotations = createAsyncThunk("quotations/fetch", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/quotations", { params });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchAnalytics = createAsyncThunk("quotations/analytics", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/quotations/analytics");
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createQuotation = createAsyncThunk("quotations/create", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/quotations", data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateQuotation = createAsyncThunk("quotations/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/quotations/${id}`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deleteQuotation = createAsyncThunk("quotations/delete", async (id, { rejectWithValue }) => {
  try { await api.delete(`/quotations/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const duplicateQuotation = createAsyncThunk("quotations/duplicate", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/quotations/${id}/duplicate`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

// Replaces the old free-form {status} update: the backend now only accepts
// a named workflow action (see backend/src/utils/quotationWorkflow.js) and
// validates the transition itself - this thunk is a thin passthrough.
export const transitionQuotation = createAsyncThunk("quotations/transition", async ({ id, action, comment }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/quotations/${id}/status`, { action, comment });
    return res.data.data; // { _id, status, acceptanceToken?, acceptanceUrl? }
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createRevision = createAsyncThunk("quotations/revise", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/quotations/${id}/revise`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchRevisions = createAsyncThunk("quotations/revisions", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/quotations/${id}/revisions`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchHistory = createAsyncThunk("quotations/history", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/quotations/${id}/history`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const quotationSlice = createSlice({
  name: "quotations",
  initialState: { list: [], pagination: {}, analytics: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.pending, (s) => { s.loading = true; })
      .addCase(fetchQuotations.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchQuotations.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchAnalytics.fulfilled, (s, a) => { s.analytics = a.payload; })
      .addCase(createQuotation.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateQuotation.fulfilled, (s, a) => {
        const i = s.list.findIndex(q => q._id === a.payload._id);
        if (i >= 0) s.list[i] = a.payload;
      })
      .addCase(deleteQuotation.fulfilled, (s, a) => { s.list = s.list.filter(q => q._id !== a.payload); })
      .addCase(duplicateQuotation.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(createRevision.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(transitionQuotation.fulfilled, (s, a) => {
        const q = s.list.find((x) => x._id === a.payload._id);
        if (q) q.status = a.payload.status;
      });
  },
});

export default quotationSlice.reducer;
