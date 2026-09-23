import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAssessments = createAsyncThunk("assessments/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/compliance-assessments", { params }); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load assessments"); }
});

export const createAssessment = createAsyncThunk("assessments/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/compliance-assessments", data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create assessment"); }
});

export const updateAssessment = createAsyncThunk("assessments/update", async ({ id, data }, { rejectWithValue }) => {
  try { const res = await api.patch(`/compliance-assessments/${id}`, data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update assessment"); }
});

export const addAssessmentEvidence = createAsyncThunk("assessments/addEvidence", async ({ id, documentId, note }, { rejectWithValue }) => {
  try { const res = await api.post(`/compliance-assessments/${id}/evidence`, { documentId, note }); return { id, evidence: res.data.data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to link evidence"); }
});

export const removeAssessmentEvidence = createAsyncThunk("assessments/removeEvidence", async ({ id, documentId }, { rejectWithValue }) => {
  try { const res = await api.delete(`/compliance-assessments/${id}/evidence/${documentId}`); return { id, evidence: res.data.data }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to unlink evidence"); }
});

const complianceAssessmentSlice = createSlice({
  name: "assessments",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessments.pending, (s) => { s.loading = true; })
      .addCase(fetchAssessments.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchAssessments.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createAssessment.fulfilled, (s, a) => { s.list.push(a.payload); })
      .addCase(updateAssessment.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload._id);
        if (i >= 0) s.list[i] = a.payload;
      })
      .addCase(addAssessmentEvidence.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload.id);
        if (i >= 0) s.list[i].evidence = a.payload.evidence;
      })
      .addCase(removeAssessmentEvidence.fulfilled, (s, a) => {
        const i = s.list.findIndex((x) => x._id === a.payload.id);
        if (i >= 0) s.list[i].evidence = a.payload.evidence;
      });
  },
});

export default complianceAssessmentSlice.reducer;
