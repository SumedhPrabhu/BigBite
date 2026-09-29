import React, { useState } from "react";
import ReelPlayer from "./ReelPlayer";
import { toast } from "react-toastify";

const ReelCard = ({
  reel,
  isActive = false,
  isMuted = false,
  onToggleMute,
  onToggleLike,
  onOpenOrder,
  onProgress,
  onComplete,
}) => {
  const [copied, setCopied] = useState(false);
  if (!reel) return null;

  const isLiked = !!reel.isLiked;
  const likesCount = reel.likesCount || 0;

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Reel link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none my-auto">
      {/* Dynamic Ambient Blur Glow behind the video */}
      <div className="absolute inset-0 max-w-4xl mx-auto bg-gradient-to-tr from-emerald-600/30 via-teal-500/20 to-amber-500/30 blur-3xl rounded-full scale-125 opacity-70 pointer-events-none -z-10" />

      {/* LEFT-BOTTOM CAPTION (Outside the reel, simple raw text, NO box, positioned cleanly) */}
      <div className="hidden lg:flex absolute right-[calc(50%+265px)] xl:right-[calc(50%+285px)] 2xl:right-[calc(50%+305px)] bottom-6 flex-col items-start w-72 xl:w-80 space-y-2.5 select-none z-20 pointer-events-auto text-left">
        {/* Restaurant Identity */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/50 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-600/30">
            {reel.restaurant?.name ? reel.restaurant.name.charAt(0) : "S"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm truncate drop-shadow-md">
              @{reel.restaurant?.name || "Snackr Kitchen"}
            </span>
            {reel.cuisine && (
              <span className="text-[11px] text-emerald-400 font-semibold drop-shadow">
                {reel.cuisine} Cuisine
              </span>
            )}
          </div>
        </div>

        {/* Dish Title */}
        <div>
          <h1 className="text-2xl xl:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
            {reel.dishName}
          </h1>
        </div>

        {/* Price, Veg/Non-Veg Tag & Category */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {reel.foodItem?.price && (
            <span className="font-black text-emerald-400 text-lg xl:text-xl drop-shadow-md">
              ₹{reel.foodItem.price}
            </span>
          )}

          {reel.foodType === "non-veg" ? (
            <span className="px-2.5 py-0.5 rounded-lg bg-rose-950/90 text-rose-300 border border-rose-600/50 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Non-Veg</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Veg</span>
            </span>
          )}

          <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-gray-200 border border-white/15 text-[11px] font-semibold backdrop-blur-md">
            {reel.category}
          </span>
        </div>

        {/* Location / Address */}
        {reel.restaurant?.address && (
          <div className="text-xs text-gray-400 flex items-center space-x-1.5 pt-1">
            <span>📍</span>
            <span className="truncate drop-shadow">{reel.restaurant.address}</span>
          </div>
        )}
      </div>

      {/* CENTER REEL & SNUG RIGHT SIDEBAR CONTAINER */}
      <div className="relative flex items-end justify-center select-none z-10">
        {/* CENTER REEL VIDEO (Large, Expanded 9:16 In-Browser Native Video Player) */}
        <div className="relative h-[calc(100vh-50px)] max-h-[960px] aspect-[9/16] w-auto bg-black rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] border border-white/15 select-none flex-shrink-0">
          <ReelPlayer
            reel={reel}
            videoId={reel.videoId}
            isActive={isActive}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            onProgress={onProgress}
            onComplete={onComplete}
          />

          {/* Mobile-Only Caption Overlay */}
          <div className="lg:hidden absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 space-y-1.5 pointer-events-auto">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-xs">
                @{reel.restaurant?.name || "Snackr Kitchen"}
              </span>
              <span className="text-emerald-400 font-extrabold text-xs">
                ₹{reel.foodItem?.price}
              </span>
              {reel.foodType === "non-veg" ? (
                <span className="px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 text-[9px] font-bold">
                  Non-Veg
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 text-[9px] font-bold">
                  Veg
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white line-clamp-1">
              {reel.dishName}
            </h2>
          </div>
        </div>

        {/* RIGHT ACTION SIDEBAR (Shifted close and snug directly next to the reel) */}
        <div className="flex flex-col items-center space-y-3.5 select-none pb-4 ml-3 sm:ml-4 z-20 pointer-events-auto flex-shrink-0">
          {/* LIKE BUTTON */}
          <div className="flex flex-col items-center group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(reel);
              }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl active:scale-90 ${
                isLiked
                  ? "bg-rose-600 text-white shadow-rose-600/50 scale-105"
                  : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 hover:scale-105"
              }`}
              title={isLiked ? "Unlike" : "Like this food reel"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110 ${
                  isLiked ? "fill-current" : ""
                }`}
                fill={isLiked ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isLiked ? 0 : 2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
              {likesCount}
            </span>
          </div>

          {/* ORDER BUTTON (Snackr Hero CTA) */}
          <div className="flex flex-col items-center group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenOrder(reel);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all duration-200 shadow-2xl shadow-emerald-500/50 active:scale-90 hover:scale-105"
              title="Order this dish now"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 transform group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </button>
            <span className="text-[11px] font-bold text-emerald-400 mt-1 drop-shadow-md">
              Order
            </span>
          </div>

          {/* VOLUME / MUTE TOGGLE */}
          <div className="flex flex-col items-center group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105"
              title={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>
            <span className="text-[10px] font-medium text-gray-300 mt-1">
              {isMuted ? "Muted" : "Sound"}
            </span>
          </div>

          {/* SHARE BUTTON */}
          <div className="flex flex-col items-center group">
            <button
              onClick={handleShare}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105"
              title="Share Reel"
            >
              {copied ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-emerald-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              )}
            </button>
            <span className="text-[10px] font-medium text-gray-300 mt-1">
              Share
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelCard;
