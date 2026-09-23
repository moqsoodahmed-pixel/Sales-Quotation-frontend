import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchServices = createAsyncThunk("catalogue/fetchServices", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/services", { params });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load catalogue"); }
});

export const fetchCategories = createAsyncThunk("catalogue/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/services/categories");
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load categories"); }
});

export const fetchStandards = createAsyncThunk("catalogue/fetchStandards", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/iso-standards");
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load ISO standards"); }
});

export const createService = createAsyncThunk("catalogue/createService", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/services", data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create service"); }
});

export const updateService = createAsyncThunk("catalogue/updateService", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/services/${id}`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update service"); }
});

export const updateServiceStatus = createAsyncThunk("catalogue/updateServiceStatus", async ({ id, isActive }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/services/${id}/status`, { isActive });
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update status"); }
});

const catalogueSlice = createSlice({
  name: "catalogue",
  initialState: { services: [], pagination: {}, categories: [], standards: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchServices.fulfilled, (s, a) => { s.loading = false; s.services = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchServices.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload; })
      .addCase(fetchStandards.fulfilled, (s, a) => { s.standards = a.payload; })
      .addCase(createService.fulfilled, (s, a) => { s.services.unshift(a.payload); })
      .addCase(updateService.fulfilled, (s, a) => {
        const i = s.services.findIndex((sv) => sv._id === a.payload._id);
        if (i >= 0) s.services[i] = a.payload;
      })
      .addCase(updateServiceStatus.fulfilled, (s, a) => {
        const i = s.services.findIndex((sv) => sv._id === a.payload._id);
        if (i >= 0) s.services[i] = a.payload;
      });
  },
});

export default catalogueSlice.reducer;
