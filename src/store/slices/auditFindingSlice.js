import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchFindings = createAsyncThunk("findings/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/audit-findings", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load findings"); }
});

export const fetchFinding = createAsyncThunk("findings/fetchOne", async (id, { rejectWithValue }) => {
  try { const res = await api.get(`/audit-findings/${id}`); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load finding"); }
});

export const createFinding = createAsyncThunk("findings/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/audit-findings", data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create finding"); }
});

export const transitionFinding = createAsyncThunk("findings/transition", async ({ id, action, comment }, { rejectWithValue }) => {
  try { const res = await api.post(`/audit-findings/${id}/transition`, { action, comment }); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Transition failed"); }
});

export const addFindingEvidence = createAsyncThunk("findings/addEvidence", async ({ id, documentId, note }, { rejectWithValue }) => {
  try { const res = await api.post(`/audit-findings/${id}/evidence`, { documentId, note }); return { id, evidence: res.data.data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to link evidence"); }
});

export const removeFindingEvidence = createAsyncThunk("findings/removeEvidence", async ({ id, documentId }, { rejectWithValue }) => {
  try { const res = await api.delete(`/audit-findings/${id}/evidence/${documentId}`); return { id, evidence: res.data.data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to unlink evidence"); }
});

const auditFindingSlice = createSlice({
  name: "findings",
  initialState: { list: [], pagination: {}, current: null, loading: false, error: null },
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFindings.pending, (s) => { s.loading = true; })
      .addCase(fetchFindings.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchFindings.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchFinding.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createFinding.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(transitionFinding.fulfilled, (s, a) => { if (s.current) s.current.status = a.payload.status; })
      .addCase(addFindingEvidence.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload.id);
        if (i >= 0) s.list[i].evidence = a.payload.evidence;
      })
      .addCase(removeFindingEvidence.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload.id);
        if (i >= 0) s.list[i].evidence = a.payload.evidence;
      });
  },
});

export const { clearCurrent } = auditFindingSlice.actions;
export default auditFindingSlice.reducer;
