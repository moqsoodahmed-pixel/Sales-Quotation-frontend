import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchUsers = createAsyncThunk("users/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/users", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchUserStats = createAsyncThunk("users/stats", async (_, { rejectWithValue }) => {
  try { const res = await api.get("/users/stats"); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createUser = createAsyncThunk("users/create", async (data, { rejectWithValue }) => {
  try { const res = await api.post("/users", data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateUser = createAsyncThunk("users/update", async ({ id, data }, { rejectWithValue }) => {
  try { const res = await api.put(`/users/${id}`, data); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const resetPassword = createAsyncThunk("users/resetPassword", async ({ id, newPassword }, { rejectWithValue }) => {
  try { await api.put(`/users/${id}/reset-password`, { newPassword }); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const userSlice = createSlice({
  name: "users",
  initialState: { list: [], stats: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.loading = true; })
      .addCase(fetchUsers.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; })
      .addCase(fetchUsers.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchUserStats.fulfilled, (s, a) => { s.stats = a.payload; })
      .addCase(createUser.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateUser.fulfilled, (s, a) => {
        const i = s.list.findIndex(u => u._id === a.payload._id);
        if (i >= 0) s.list[i] = a.payload;
      });
  },
});

export default userSlice.reducer;
