import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCustomers = createAsyncThunk("customers/fetch", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/customers", { params });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load customers"); }
});

export const fetchCustomer = createAsyncThunk("customers/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/customers/${id}`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load customer"); }
});

export const createCustomer = createAsyncThunk("customers/create", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/customers", data);
    return res.data.data;
  } catch (err) {
    if (err.response?.status === 409) return rejectWithValue(err.response.data.message);
    return rejectWithValue(err.response?.data?.message || "Failed to create customer");
  }
});

export const updateCustomer = createAsyncThunk("customers/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/customers/${id}`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update customer"); }
});

export const archiveCustomer = createAsyncThunk("customers/archive", async (id, { rejectWithValue }) => {
  try { await api.delete(`/customers/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to archive customer"); }
});

export const createEnquiryFromCustomer = createAsyncThunk("customers/createEnquiry", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/customers/${id}/enquiry`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create enquiry"); }
});

const customerSlice = createSlice({
  name: "customers",
  initialState: { list: [], pagination: {}, current: null, loading: false, error: null },
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCustomers.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchCustomers.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCustomer.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createCustomer.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateCustomer.fulfilled, (s, a) => {
        const i = s.list.findIndex((c) => c._id === a.payload._id);
        if (i >= 0) s.list[i] = a.payload;
        if (s.current?._id === a.payload._id) s.current = { ...s.current, ...a.payload };
      })
      .addCase(archiveCustomer.fulfilled, (s, a) => { s.list = s.list.filter((c) => c._id !== a.payload); });
  },
});

export const { clearCurrent } = customerSlice.actions;
export default customerSlice.reducer;
