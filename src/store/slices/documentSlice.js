import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchDocuments = createAsyncThunk("documents/fetch", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/documents", { params });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load documents"); }
});

export const uploadDocument = createAsyncThunk("documents/upload", async (formData, { rejectWithValue }) => {
  try {
    // Letting the browser set the multipart Content-Type (with boundary)
    // itself - overriding the api instance's default 'application/json'
    // header for just this call.
    const res = await api.post("/documents", formData, { headers: { "Content-Type": undefined } });
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Upload failed"); }
});

export const updateDocument = createAsyncThunk("documents/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/documents/${id}`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Update failed"); }
});

export const deactivateDocument = createAsyncThunk("documents/deactivate", async (id, { rejectWithValue }) => {
  try { await api.delete(`/documents/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to deactivate document"); }
});

// Not a thunk - triggers a browser download of an authenticated binary
// response. Kept as a plain async helper since it doesn't touch Redux state.
export const downloadDocumentFile = async (id, filename) => {
  const res = await api.get(`/documents/${id}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "document";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const documentSlice = createSlice({
  name: "documents",
  initialState: { list: [], pagination: {}, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDocuments.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchDocuments.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(uploadDocument.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateDocument.fulfilled, (s, a) => {
        const i = s.list.findIndex((d) => d._id === a.payload._id);
        if (i >= 0) s.list[i] = a.payload;
      })
      .addCase(deactivateDocument.fulfilled, (s, a) => {
        const i = s.list.findIndex((d) => d._id === a.payload);
        if (i >= 0) s.list[i] = { ...s.list[i], isActive: false, status: "ARCHIVED" };
      });
  },
});

export default documentSlice.reducer;
