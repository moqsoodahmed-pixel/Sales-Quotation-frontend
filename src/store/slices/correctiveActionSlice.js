import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCorrectiveActions = createAsyncThunk("correctiveActions/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/corrective-actions", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load corrective actions"); }
});

export const fetchCorrectiveAction = createAsyncThunk("correctiveActions/fetchOne", async (id, { rejectWithValue }) => {
  try { const res = await api.get(`/corrective-actions/${id}`); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load corrective action"); }
});

export const createCorrectiveAction = createAsyncThunk("correctiveActions/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/corrective-actions", data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create corrective action"); }
});

export const updateCorrectiveAction = createAsyncThunk("correctiveActions/update", async ({ id, data }, { rejectWithValue }) => {
  try { const res = await api.patch(`/corrective-actions/${id}`, data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update corrective action"); }
});

export const transitionCorrectiveAction = createAsyncThunk("correctiveActions/transition", async ({ id, action, comment }, { rejectWithValue }) => {
  try { const res = await api.post(`/corrective-actions/${id}/transition`, { action, comment }); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Transition failed"); }
});

export const addCorrectiveActionEvidence = createAsyncThunk("correctiveActions/addEvidence", async ({ id, documentId, note }, { rejectWithValue }) => {
  try { const res = await api.post(`/corrective-actions/${id}/evidence`, { documentId, note }); return { id, evidence: res.data.data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to link evidence"); }
});

export const removeCorrectiveActionEvidence = createAsyncThunk("correctiveActions/removeEvidence", async ({ id, documentId }, { rejectWithValue }) => {
  try { const res = await api.delete(`/corrective-actions/${id}/evidence/${documentId}`); return { id, evidence: res.data.data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to unlink evidence"); }
});

const correctiveActionSlice = createSlice({
  name: "correctiveActions",
  initialState: { list: [], pagination: {}, current: null, loading: false, error: null },
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCorrectiveActions.pending, (s) => { s.loading = true; })
      .addCase(fetchCorrectiveActions.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchCorrectiveActions.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCorrectiveAction.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createCorrectiveAction.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateCorrectiveAction.fulfilled, (s, a) => { if (s.current?._id === a.payload._id) s.current = a.payload; })
      .addCase(transitionCorrectiveAction.fulfilled, (s, a) => { if (s.current) { s.current.status = a.payload.status; s.current.dueStatus = a.payload.dueStatus; } })
      .addCase(addCorrectiveActionEvidence.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload.id);
        if (i >= 0) s.list[i].evidence = a.payload.evidence;
      })
      .addCase(removeCorrectiveActionEvidence.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload.id);
        if (i >= 0) s.list[i].evidence = a.payload.evidence;
      });
  },
});

export const { clearCurrent } = correctiveActionSlice.actions;
export default correctiveActionSlice.reducer;
