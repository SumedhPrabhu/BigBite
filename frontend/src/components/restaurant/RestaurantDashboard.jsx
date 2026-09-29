import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "react-toastify";
import Loader from "../layout/Loader";

const RestaurantDashboard = () => {
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("items"); // 'items' | 'orders' | 'ai' | 'settings'
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [analyzingReviews, setAnalyzingReviews] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [updatingCover, setUpdatingCover] = useState(false);

  // Form states for new food item
  const defaultItemState = {
    name: "",
    category: "",
    price: "",
    stock: 50,
    isVeg: true,
    spiceLevel: "Medium",
    description: "",
    imageUrl: "",
    tags: [],
    allergens: [],
    serves: "1-2 People",
    bestFor: [],
  };
  const [newItem, setNewItem] = useState(defaultItemState);


  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate("/users/login");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        if (!user?.restaurantId) {
          toast.error("No store linked to this partner account.");
          setLoading(false);
          return;
        }

        const { data: restData } = await api.get(`/api/v1/eats/stores/${user.restaurantId}`);
        const current = restData.data;

        setSelectedRestaurant(current);

        if (current) {
          await loadStoreDetails(current._id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load restaurant dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, isAuthenticated, navigate]);

  // Polling for real-time updates
  useEffect(() => {
    if (!selectedRestaurant) return;
    const interval = setInterval(() => {
      loadStoreDetails(selectedRestaurant._id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedRestaurant]);

  const loadStoreDetails = async (storeId) => {
    try {
      // 1. Load Food Items
      const { data: itemData } = await api.get(
        `/api/v1/eats/items/${storeId}`
      );
      setFoodItems(itemData.data || []);

      // 2. Load Orders
      const { data: orderData } = await api.get(
        `/api/v1/eats/orders/restaurant/${storeId}`,
        { withCredentials: true }
      );
      setOrders(orderData.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestaurantChange = async (e) => {
    const storeId = e.target.value;
    const store = restaurants.find((r) => r._id === storeId);
    setSelectedRestaurant(store);
    if (store) {
      setLoading(true);
      await loadStoreDetails(store._id);
      setLoading(false);
    }
  };

  // Generate AI Metadata for new item
  const generateAIMetadata = async () => {
    if (!newItem.name || !newItem.price) {
      toast.warning("Please provide Dish Name and Price first");
      return;
    }

    setAiLoading(true);
    try {
      const { data } = await api.post("/api/v1/ai/generate-food", {
        name: newItem.name,
        category: newItem.category,
        spiceLevel: newItem.spiceLevel,
        price: Number(newItem.price),
      });

      if (data && data.data) {
        const ai = data.data;
        setNewItem((prev) => ({
          ...prev,
          description: ai.description || prev.description,
          tags: ai.tags || prev.tags,
          allergens: ai.allergens || prev.allergens,
          serves: ai.serves || prev.serves,
          bestFor: ai.bestFor || prev.bestFor,
        }));
        toast.success("✨ AI description & metadata generated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI metadata");
    } finally {
      setAiLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditMode(false);
    setEditingItemId(null);
    setNewItem(defaultItemState);
    setImageFile(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditMode(true);
    setEditingItemId(item._id);
    setNewItem({
      name: item.name,
      category: item.category || "",
      price: item.price,
      stock: item.stock,
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel || "Medium",
      description: item.description,
      imageUrl: item.images?.[0]?.url || "",
      tags: item.aiTags || [],
      allergens: item.aiAllergens || [],
      serves: item.aiServes || "1-2 People",
      bestFor: item.aiBestFor || [],
    });
    setImageFile(null);
    setShowAddModal(true);
  };

  // Submit food item (Create or Update)
  const handleSaveFoodItem = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      toast.error("No restaurant selected");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("category", newItem.category);
      formData.append("price", Number(newItem.price));
      formData.append("stock", Number(newItem.stock));
      formData.append("isVeg", newItem.isVeg);
      formData.append("spiceLevel", newItem.spiceLevel);
      formData.append("description", newItem.description);
      formData.append("restaurant", selectedRestaurant._id);
      
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (newItem.imageUrl) {
        formData.append("imageUrl", newItem.imageUrl);
      } else if (!editMode) {
        formData.append("imageUrl", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80");
      }

      // Add AI fields
      formData.append("aiDescription", newItem.description);
      newItem.tags.forEach(t => formData.append("aiTags[]", t));
      newItem.allergens.forEach(a => formData.append("aiAllergens[]", a));
      formData.append("aiServes", newItem.serves);
      newItem.bestFor.forEach(b => formData.append("aiBestFor[]", b));

      if (editMode) {
        await api.put(`/api/v1/eats/item/${editingItemId}`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`${newItem.name} updated successfully!`);
      } else {
        await api.post("/api/v1/eats/item", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`${newItem.name} added to menu!`);
      }

      setShowAddModal(false);
      setNewItem(defaultItemState);
      setImageFile(null);

      // Refresh items
      await loadStoreDetails(selectedRestaurant._id);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save food item");
    }
  };

  // Toggle Item Stock
  const toggleStock = async (item) => {
    const newStock = item.stock > 0 ? 0 : 50;
    try {
      await api.put(
        `/api/v1/eats/item/${item._id}`,
        { stock: newStock },
        { withCredentials: true }
      );
      setFoodItems((prev) =>
        prev.map((it) => (it._id === item._id ? { ...it, stock: newStock } : it))
      );
      toast.info(
        `${item.name} marked ${newStock > 0 ? "In Stock" : "Out of Stock"}`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  // Delete Food Item
  const deleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    try {
      await api.delete(`/api/v1/eats/item/${itemId}`, {
        withCredentials: true,
      });
      setFoodItems((prev) => prev.filter((it) => it._id !== itemId));
      toast.success("Food item removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  // Update Order Status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(
        `/api/v1/eats/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId ? { ...ord, orderStatus: newStatus } : ord
        )
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  // Run AI Review Analyzer with AI
  const handleUpdateCoverPhoto = async (e) => {
    e.preventDefault();
    if (!coverImageFile && !coverImageUrl) {
      toast.warning("Please provide a cover photo via file or URL.");
      return;
    }
    try {
      setUpdatingCover(true);
      const formData = new FormData();
      if (coverImageFile) {
        formData.append("image", coverImageFile);
      } else if (coverImageUrl) {
        formData.append("imageUrl", coverImageUrl);
      }

      const { data } = await api.put(
        `/api/v1/eats/stores/${selectedRestaurant._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      
      setSelectedRestaurant(data.data);
      toast.success("Cover photo updated successfully!");
      setCoverImageFile(null);
      setCoverImageUrl("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update cover photo");
    } finally {
      setUpdatingCover(false);
    }
  };

  const runAIReviewAnalysis = async () => {
    if (!selectedRestaurant) return;
    setAnalyzingReviews(true);
    try {
      const { data } = await api.post(
        `/api/v1/ai/analyze-reviews/${selectedRestaurant._id}`
      );
      if (data && data.aiData) {
        setSelectedRestaurant((prev) => ({
          ...prev,
          reviewSentiment: data.aiData.sentiment,
          reviewSummaryBullets: data.aiData.summaryBullets,
          reviewTopMentions: data.aiData.topMentions,
        }));
        toast.success("✨ AI Review Insights refreshed with AI!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to analyze reviews");
    } finally {
      setAnalyzingReviews(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Top Banner & Store Selection */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl border border-transparent p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-white/20 backdrop-blur-sm text-white rounded-xl text-xs font-bold uppercase tracking-wider">
              Partner Hub
            </span>
            <span className="text-xs text-emerald-100">Snackr Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Restaurant Management
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100">
            Manage your menu items, track real-time orders, and run AI insights.
          </p>
        </div>

        {/* Store Name Title instead of Dropdown */}
        <div className="flex items-center space-x-3">
          {selectedRestaurant && (
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mr-4">
              {selectedRestaurant.name}
            </h2>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-emerald-700 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <span>+ Add Dish</span>
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : selectedRestaurant ? (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Dishes
              </span>
              <p className="text-2xl font-extrabold text-gray-900">
                {foodItems.length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Orders
              </span>
              <p className="text-2xl font-extrabold text-emerald-600">
                {orders.length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Store Rating
              </span>
              <p className="text-2xl font-extrabold text-amber-500 flex items-center">
                ★ {Number(selectedRestaurant.ratings || 0).toFixed(1)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                In-Stock Items
              </span>
              <p className="text-2xl font-extrabold text-gray-900">
                {foodItems.filter((it) => it.stock > 0).length} /{" "}
                {foodItems.length}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("items")}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === "items"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              🍔 Menu Dishes ({foodItems.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === "orders"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              📦 Incoming Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === "ai"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              ✨ AI Insights
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === "settings"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Tab 1: Menu Items Management */}
          {activeTab === "items" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Manage Menu Catalog
                </h2>
                <button
                  onClick={handleOpenAddModal}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  + Add New Item
                </button>
              </div>

              {foodItems.length === 0 ? (
                <div className="text-center py-16 px-4 text-gray-500">
                  <p className="text-sm">No dishes added for this restaurant yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5">Dish</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Price</th>
                        <th className="px-6 py-3.5">Stock Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {foodItems.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/60">
                          <td className="px-6 py-4 flex items-center space-x-3">
                            <img
                              src={
                                item.images?.[0]?.url ||
                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80"
                              }
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80";
                              }}
                            />
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                {item.name}
                              </p>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  item.isVeg !== false
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {item.isVeg !== false ? "Veg" : "Non-Veg"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-700">
                            {item.category || "General"}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            ₹{item.price}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleStock(item)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                item.stock > 0
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                            >
                              {item.stock > 0
                                ? `In Stock (${item.stock})`
                                : "Out of Stock"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(item._id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Orders Management */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                Live Store Orders
              </h2>

              {orders.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-sm">No incoming orders for this store yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord._id}
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-gray-900">
                            #{ord._id.substring(ord._id.length - 8)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">
                            Customer:{" "}
                            <strong>{ord.user?.name || "Customer"}</strong> (
                            {ord.deliveryInfo?.phoneNo || "N/A"})
                          </span>
                        </div>

                        <p className="text-xs text-gray-500">
                          {ord.deliveryInfo?.address}, {ord.deliveryInfo?.city}
                        </p>

                        <div className="text-xs text-gray-700 font-medium">
                          Items:{" "}
                          {(ord.orderItems || [])
                            .map((it) => `${it.quantity}x ${it.name}`)
                            .join(", ")}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-base font-extrabold text-gray-900">
                          ₹{ord.finalTotal}
                        </span>

                        <select
                          value={ord.orderStatus || "Processing"}
                          onChange={(e) =>
                            handleStatusChange(ord._id, e.target.value)
                          }
                          className="text-xs font-bold border border-gray-200 bg-white rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Out for Delivery">
                            Out for Delivery
                          </option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: AI Review Insights */}
          {activeTab === "ai" && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    AI Sentiment & Review Analysis
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Analyzes customer feedback and generates key highlights automatically.
                  </p>
                </div>

                <button
                  onClick={runAIReviewAnalysis}
                  disabled={analyzingReviews}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>
                    {analyzingReviews
                      ? "Analyzing with AI..."
                      : "⚡ Run AI Analysis"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    Overall Sentiment
                  </span>
                  <p className="text-2xl font-extrabold capitalize text-emerald-900">
                    {selectedRestaurant.reviewSentiment || "Positive"}
                  </p>
                </div>

                <div className="md:col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Key Highlights
                  </span>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside">
                    {(
                      selectedRestaurant.reviewSummaryBullets || [
                        "Consistently praised for quick delivery and fresh food.",
                        "Signature dishes enjoy high ratings.",
                      ]
                    ).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedRestaurant.reviewTopMentions &&
                selectedRestaurant.reviewTopMentions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-700">
                      Top Keywords Mentioned by Customers:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedRestaurant.reviewTopMentions.map((m, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-lg border border-emerald-200"
                        >
                          #{m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Tab 4: Settings */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Restaurant Settings
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage your store's appearance and configuration.
                </p>
              </div>

              <div className="max-w-xl">
                <form onSubmit={handleUpdateCoverPhoto} className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Update Cover Photo</h3>
                  
                  {/* Current Photo Preview */}
                  {selectedRestaurant.images && selectedRestaurant.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Current Cover:</p>
                      <img 
                        src={selectedRestaurant.images[0].url} 
                        alt="Current Cover" 
                        className="w-full h-40 object-cover rounded-2xl border border-gray-200"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Local File Upload
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setCoverImageFile(e.target.files[0]);
                          setCoverImageUrl("");
                        }}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Or Paste Image URL
                      </label>
                      <input
                        type="url"
                        value={coverImageUrl}
                        onChange={(e) => {
                          setCoverImageUrl(e.target.value);
                          setCoverImageFile(null);
                        }}
                        placeholder="https://..."
                        className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingCover || (!coverImageFile && !coverImageUrl)}
                    className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition-colors w-full sm:w-auto"
                  >
                    {updatingCover ? "Updating..." : "Save Cover Photo"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-sm text-gray-600">No restaurants available.</p>
        </div>
      )}

      {/* Add New Dish Modal with AI Generator */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editMode ? "Edit Dish" : "Add New Dish"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editMode ? "Update" : "Add to"} {selectedRestaurant?.name} menu
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFoodItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category (Type to add custom)
                  </label>
                  <input
                    type="text"
                    list="category-options"
                    value={newItem.category}
                    placeholder="e.g. Chef Specials"
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <datalist id="category-options">
                    <option value="Starters" />
                    <option value="Main Course" />
                    <option value="Breads" />
                    <option value="Rice & Biryani" />
                    <option value="Desserts" />
                    <option value="Beverages" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="250"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dietary Type
                  </label>
                  <select
                    value={newItem.isVeg ? "veg" : "nonveg"}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        isVeg: e.target.value === "veg",
                      })
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="veg">🟢 Pure Veg</option>
                    <option value="nonveg">🔴 Non-Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Spice Level
                  </label>
                  <select
                    value={newItem.spiceLevel}
                    onChange={(e) =>
                      setNewItem({ ...newItem, spiceLevel: e.target.value })
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="No Spice">No Spice</option>
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Spicy">Spicy</option>
                  </select>
                </div>
              </div>

              {/* AI Generator Button */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-900 block">
                    ✨ AI Assistant
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Auto-generate description, tags & allergens
                  </span>
                </div>
                <button
                  type="button"
                  onClick={generateAIMetadata}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {aiLoading ? "Generating..." : "Generate ✨"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="Appetizing dish description..."
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newItem.imageUrl}
                    onChange={(e) =>
                      setNewItem({ ...newItem, imageUrl: e.target.value })
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Or Upload Local Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full text-sm border border-gray-200 rounded-xl p-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                >
                  {editMode ? "Update Dish" : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
