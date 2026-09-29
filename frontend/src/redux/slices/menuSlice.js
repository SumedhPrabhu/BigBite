import { createSlice } from "@reduxjs/toolkit";
import {
  getMenus,
  createMenu,
  addItemToMenu,
} from "../actions/menuActions";

const initialState = {
  menus: [],
  menuId: null,
  loading: false,
  error: null,

  creating: false,
  createError: null,

  addingItem: false,
  addError: null,
};

const menuSlice = createSlice({
  name: "menus",
  initialState,
  reducers: {
    clearMenuErrors: (state) => {
      state.error = null;
      state.createError = null;
      state.addError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      //GET MENUS
      .addCase(getMenus.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.menus = action.payload.menu;
        state.menuId = action.payload.menuId;
      })
      .addCase(getMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //CREATE MENU
      .addCase(createMenu.pending, (state) => {
        state.creating = true;
      })
      .addCase(createMenu.fulfilled, (state, action) => {
        state.creating = false;
        state.newMenu = action.payload;
      })
      .addCase(createMenu.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload;
      })

      //ADD ITEM
      .addCase(addItemToMenu.pending, (state) => {
        state.addingItem = true;
      })
      .addCase(addItemToMenu.fulfilled, (state, action) => {
        state.addingItem = false;
        state.updatedMenu = action.payload;
      })
      .addCase(addItemToMenu.rejected, (state, action) => {
        state.addingItem = false;
        state.addError = action.payload;
      });
  },
});

export const { clearMenuErrors } = menuSlice.actions;

export default menuSlice.reducer;