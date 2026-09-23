import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchEnquiries = createAsyncThunk("enquiries/fetch", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/enquiries", { params });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load enquiries"); }
});

export const fetchEnquiry = createAsyncThunk("enquiries/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/enquiries/${id}`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load enquiry"); }
});

export const createEnquiry = createAsyncThunk("enquiries/create", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/enquiries", data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create enquiry"); }
});

export const updateEnquiry = createAsyncThunk("enquiries/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/enquiries/${id}`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update enquiry"); }
});

export const archiveEnquiry = createAsyncThunk("enquiries/archive", async (id, { rejectWithValue }) => {
  try { await api.delete(`/enquiries/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to archive enquiry"); }
});

const enquirySlice = createSlice({
  name: "enquiries",
  initialState: { list: [], pagination: {}, current: null, loading: false, error: null },
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnquiries.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchEnquiries.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchEnquiries.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchEnquiry.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createEnquiry.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateEnquiry.fulfilled, (s, a) => {
        const i = s.list.findIndex((e) => e._id === a.payload._id);
        if (i >= 0) s.list[i] = a.payload;
        if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload };
      })
      .addCase(archiveEnquiry.fulfilled, (s, a) => { s.list = s.list.filter((e) => e._id !== a.payload); });
  },
});

export const { clearCurrent } = enquirySlice.actions;
export default enquirySlice.reducer;
