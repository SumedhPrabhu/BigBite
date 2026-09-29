import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ReelCard from "./ReelCard";
import OrderOptionsModal from "./OrderOptionsModal";
import api from "../../utils/api";

const Reels = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [orderModalReel, setOrderModalReel] = useState(null);

  // Watch time accumulator for current active reel
  const currentWatchRef = useRef({
    reelId: null,
    watchTime: 0,
    completionRate: 0,
    completed: false,
  });

  // Lock outer body scrolling on mount, restore on unmount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Fetch Reels Batch
  const fetchFeed = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const { data } = await api.get("/api/v1/reels/feed", {
          params: { page: pageNum, limit: 8 },
        });

        if (data.success) {
          if (append) {
            setReels((prev) => [...prev, ...data.reels]);
          } else {
            setReels(data.reels);
          }
          setHasMore(data.hasMore);
          setPage(data.page);
          setIsPersonalized(data.isPersonalized);
        }
      } catch (err) {
        console.error("Error fetching reels feed:", err);
        toast.error("Unable to load discovery feed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Flush watch interaction for the previous reel
  const flushInteraction = useCallback(async () => {
    const current = currentWatchRef.current;
    if (current.reelId && current.watchTime > 0) {
      try {
        await api.post(`/api/v1/reels/${current.reelId}/interaction`, {
          watchTime: Math.round(current.watchTime),
          completionRate: Math.round(current.completionRate),
          completed: current.completed,
        });
      } catch (e) {}
    }
  }, []);

  // Change active reel
  const changeReel = useCallback(
    (newIndex) => {
      if (newIndex < 0 || newIndex >= reels.length) return;

      flushInteraction();

      const nextReel = reels[newIndex];
      currentWatchRef.current = {
        reelId: nextReel?._id || null,
        watchTime: 0,
        completionRate: 0,
        completed: false,
      };

      setCurrentIndex(newIndex);

      // Pre-fetch next batch when nearing end
      if (newIndex >= reels.length - 3 && hasMore && !loadingMore) {
        fetchFeed(page + 1, true);
      }
    },
    [reels, hasMore, loadingMore, page, fetchFeed, flushInteraction]
  );

  // Sync initial reel ID on load
  useEffect(() => {
    if (reels.length > 0 && !currentWatchRef.current.reelId) {
      currentWatchRef.current.reelId = reels[0]._id;
    }
  }, [reels]);

  // Flush interaction on unmount
  useEffect(() => {
    return () => {
      flushInteraction();
    };
  }, [flushInteraction]);

  // Dedicated wheel listener to scroll reels exclusively
  const scrollLockRef = useRef(false);
  useEffect(() => {
    const handleWheel = (e) => {
      if (orderModalReel) return;
      e.preventDefault();

      if (scrollLockRef.current) return;

      if (e.deltaY > 25) {
        scrollLockRef.current = true;
        changeReel(currentIndex + 1);
        setTimeout(() => {
          scrollLockRef.current = false;
        }, 400);
      } else if (e.deltaY < -25) {
        scrollLockRef.current = true;
        changeReel(currentIndex - 1);
        setTimeout(() => {
          scrollLockRef.current = false;
        }, 400);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentIndex, reels.length, changeReel, orderModalReel]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (orderModalReel) return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        changeReel(currentIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        changeReel(currentIndex - 1);
      } else if (e.key === "Escape") {
        navigate("/");
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, reels.length, changeReel, orderModalReel, navigate]);

  // Touch Swipe for mobile/trackpad gestures
  const touchStartY = useRef(0);
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (orderModalReel) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) {
      changeReel(currentIndex + 1);
    } else if (diff < -50) {
      changeReel(currentIndex - 1);
    }
  };

  // Progress Tracking Callback
  const handleProgress = ({ currentTime, duration, completionRate }) => {
    currentWatchRef.current.watchTime = currentTime;
    currentWatchRef.current.completionRate = completionRate;
  };

  const handleComplete = () => {
    currentWatchRef.current.completed = true;
  };

  // Like / Unlike Toggle
  const handleToggleLike = async (reel) => {
    if (!user) {
      toast.info("Please log in to like dishes and personalize your feed");
      navigate("/users/login");
      return;
    }

    try {
      const { data } = await api.post(`/api/v1/reels/${reel._id}/like`);
      if (data.success) {
        setReels((prev) =>
          prev.map((r) =>
            r._id === reel._id
              ? { ...r, isLiked: data.liked, likesCount: data.likesCount }
              : r
          )
        );
      }
    } catch (err) {
      toast.error("Failed to update like");
    }
  };

  const handleOpenOrder = (reel) => {
    setOrderModalReel(reel);
  };

  const handleCloseReels = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0c0d11] flex flex-col items-center justify-center space-y-4 text-white select-none">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-300 animate-pulse">
          Curating food reels...
        </p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0c0d11] flex flex-col items-center justify-center text-center p-6 text-white select-none">
        <div className="w-20 h-20 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-2xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No Reels Found</h3>
        <p className="text-sm text-gray-400 max-w-sm mb-6">
          Check back shortly for fresh culinary discoveries.
        </p>
        <button
          onClick={handleCloseReels}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg hover:bg-emerald-700 transition-all"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const activeReel = reels[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#090a0e] flex flex-col items-center justify-center text-white select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Cinema Lighting Mesh */}
      <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-emerald-700/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] bg-teal-600/15 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] bg-amber-600/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Floating Top Header Bar (Zero vertical height penalty for the reel) */}
      <header className="absolute top-4 inset-x-6 z-40 flex items-center justify-between pointer-events-none">
        {/* Snackr Brand & Mode */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-600/30">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white flex items-center space-x-1.5 drop-shadow-md">
              <span>Snackr</span>
              <span className="text-emerald-400">Reels</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium drop-shadow">
              {isPersonalized ? "✨ Personalized" : "🔥 Discovery"}
            </span>
          </div>
        </div>

        {/* Counter & Close Button */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-black/40 text-gray-300 text-xs font-semibold backdrop-blur-md border border-white/10 shadow">
            {currentIndex + 1} of {reels.length}
          </span>

          <button
            onClick={handleCloseReels}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/15 backdrop-blur-md shadow-xl"
            title="Close Reels (Return to Home)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Full-Height Center Viewport */}
      <main className="relative w-full h-full flex items-center justify-center px-4 py-3">
        <ReelCard
          key={activeReel._id}
          reel={activeReel}
          isActive={true}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          onToggleLike={handleToggleLike}
          onOpenOrder={handleOpenOrder}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      </main>

      {/* Order Options Modal */}
      <OrderOptionsModal
        isOpen={!!orderModalReel}
        onClose={() => setOrderModalReel(null)}
        reel={orderModalReel}
      />
    </div>
  );
};

export default Reels;
