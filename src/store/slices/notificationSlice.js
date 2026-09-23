import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchNotifications = createAsyncThunk("notifications/fetch", async (params = {}, { rejectWithValue }) => {
  try { const res = await api.get("/notifications", { params }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to load notifications"); }
});

export const fetchUnreadCount = createAsyncThunk("notifications/unreadCount", async (_, { rejectWithValue }) => {
  try { const res = await api.get("/notifications/unread-count"); return res.data.data.count; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const markNotificationRead = createAsyncThunk("notifications/markRead", async (id, { rejectWithValue }) => {
  try { const res = await api.patch(`/notifications/${id}/read`); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to mark read"); }
});

export const markAllNotificationsRead = createAsyncThunk("notifications/markAllRead", async (_, { rejectWithValue }) => {
  try { await api.patch("/notifications/read-all"); return true; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to mark all read"); }
});

export const fetchPreferences = createAsyncThunk("notifications/fetchPreferences", async (_, { rejectWithValue }) => {
  try { const res = await api.get("/notifications/preferences"); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updatePreference = createAsyncThunk("notifications/updatePreference", async ({ notificationType, inAppEnabled }, { rejectWithValue }) => {
  try { const res = await api.patch("/notifications/preferences", { notificationType, inAppEnabled }); return res.data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState: { list: [], pagination: {}, unreadCount: 0, preferences: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; })
      .addCase(fetchNotifications.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchUnreadCount.fulfilled, (s, a) => { s.unreadCount = a.payload; })
      .addCase(markNotificationRead.fulfilled, (s, a) => {
        const i = s.list.findIndex((n) => n._id === a.payload._id);
        if (i >= 0 && !s.list[i].isRead) { s.list[i] = a.payload; s.unreadCount = Math.max(0, s.unreadCount - 1); }
      })
      .addCase(markAllNotificationsRead.fulfilled, (s) => {
        s.list = s.list.map((n) => ({ ...n, isRead: true }));
        s.unreadCount = 0;
      })
      .addCase(fetchPreferences.fulfilled, (s, a) => { s.preferences = a.payload; })
      .addCase(updatePreference.fulfilled, (s, a) => {
        const i = s.preferences.findIndex((p) => p.notificationType === a.payload.notificationType);
        if (i >= 0) s.preferences[i] = a.payload;
      });
  },
});

export default notificationSlice.reducer;
