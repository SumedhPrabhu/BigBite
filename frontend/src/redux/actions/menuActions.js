import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api"; 

//GET MENUS
export const getMenus = createAsyncThunk(
  "menus/getMenus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/v1/eats/stores/${id}/menus`);

      let menuData = [];
      let menuDocId = null;
     console.log("getMenus response", response);
      if (response.data.data && response.data.data.length > 0) {
        menuDocId = response.data.data[0]._id;
        menuData = response.data.data[0].menu;
      }

      return { menu: menuData, menuId: menuDocId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

//CREATE MENU
export const createMenu = createAsyncThunk(
  "menus/createMenu",
  async ({ restaurantId, category }, { rejectWithValue }) => {
    try {
      const body = {
        restaurant: restaurantId,
        menu: [{ category, items: [] }],
      };

      const { data } = await API.post(
        `/api/v1/eats/stores/${restaurantId}/menus`,
        body,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

//ADD ITEM
export const addItemToMenu = createAsyncThunk(
  "menus/addItemToMenu",
  async (
    { menuId, category, foodItemId, restaurantId },
    { rejectWithValue }
  ) => {
    try {
      const body = { category, foodItemId };

      const { data } = await API.post(
        `/api/v1/eats/stores/${restaurantId}/menus/${menuId}/addItem`,
        body,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);