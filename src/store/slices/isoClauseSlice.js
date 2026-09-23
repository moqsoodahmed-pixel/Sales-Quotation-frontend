import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchClauses = createAsyncThunk("isoClauses/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/iso-clauses", { params }); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load clauses"); }
});

export const createClause = createAsyncThunk("isoClauses/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/iso-clauses", data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create clause"); }
});

const isoClauseSlice = createSlice({
  name: "isoClauses",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClauses.pending, (s) => { s.loading = true; })
      .addCase(fetchClauses.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchClauses.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createClause.fulfilled, (s, a) => { s.list.push(a.payload); });
  },
});

export default isoClauseSlice.reducer;
