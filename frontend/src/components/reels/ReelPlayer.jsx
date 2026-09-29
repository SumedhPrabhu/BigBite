import React, { useEffect, useRef, useState } from "react";

let ytScriptPromise = null;
const loadYouTubeIframeApi = () => {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (!ytScriptPromise) {
    ytScriptPromise = new Promise((resolve) => {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };
    });
  }
  return ytScriptPromise;
};

/**
 * YouTube Shorts Player
 * - Complete mask over YouTube's default bezel and paused button
 * - 1.58x full-bleed zoom to completely clip all horizontal partition lines and scrubbers
 * - Clean Snackr play/pause state indicator that eliminates all native YouTube UI
 */
const ReelPlayer = ({
  videoId,
  isActive = false,
  isMuted = false,
  onToggleMute,
  onProgress,
  onComplete,
  onError,
}) => {
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [browserBlockedAudio, setBrowserBlockedAudio] = useState(false);

  const playerId = useRef(
    `yt-player-${videoId}-${Math.random().toString(36).substr(2, 9)}`
  ).current;

  // Initialize YouTube Player
  useEffect(() => {
    let isMounted = true;
    setVideoStarted(false);

    loadYouTubeIframeApi().then((YT) => {
      if (!isMounted || !document.getElementById(playerId)) return;

      try {
        playerRef.current = new YT.Player(playerId, {
          videoId,
          playerVars: {
            autoplay: isActive ? 1 : 0,
            mute: isMuted ? 1 : 0,
            controls: 0,
            cc_load_policy: 0,
            cc_lang_pref: "none",
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            loop: 1,
            disablekb: 1,
            fs: 0,
            showinfo: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              setIsReady(true);

              try {
                if (typeof event.target.unloadModule === "function") {
                  event.target.unloadModule("captions");
                  event.target.unloadModule("cc");
                }
              } catch (e) {}

              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
                event.target.setVolume(100);
              }

              if (isActive) {
                const playPromise = event.target.playVideo();
                if (playPromise && typeof playPromise.catch === "function") {
                  playPromise.catch(() => {
                    event.target.mute();
                    event.target.playVideo();
                    setBrowserBlockedAudio(true);
                  });
                }
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setVideoStarted(true);
                startProgressTracker();
              } else if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                stopProgressTracker();
              } else if (event.data === YT.PlayerState.ENDED) {
                if (onComplete) onComplete();
              }
            },
            onError: (err) => {
              console.warn(`YouTube Player Error for ${videoId}:`, err.data);
              if (isMounted) {
                setHasError(true);
                if (onError) onError(err);
              }
            },
          },
        });
      } catch (e) {
        console.error("Error creating YouTube player:", e);
        if (isMounted) setHasError(true);
      }
    });

    return () => {
      isMounted = false;
      stopProgressTracker();
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [videoId]);

  // Handle active state changes
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      if (isActive) {
        if (!isMuted) {
          playerRef.current.unMute();
          playerRef.current.setVolume(100);
        }
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
        stopProgressTracker();
      }
    } catch (e) {}
  }, [isActive, isReady, isMuted]);

  // Handle mute changes
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setBrowserBlockedAudio(false);
      }
    } catch (e) {}
  }, [isMuted, isReady]);

  // Progress Tracker
  const startProgressTracker = () => {
    stopProgressTracker();
    progressIntervalRef.current = setInterval(() => {
      if (
        !playerRef.current ||
        typeof playerRef.current.getCurrentTime !== "function"
      )
        return;
      try {
        const currentTime = playerRef.current.getCurrentTime() || 0;
        const duration = playerRef.current.getDuration() || 30;
        const completionRate =
          duration > 0 ? (currentTime / duration) * 100 : 0;

        if (onProgress) {
          onProgress({ currentTime, duration, completionRate });
        }

        if (completionRate >= 95 && onComplete) {
          onComplete();
        }
      } catch (e) {}
    }, 800);
  };

  const stopProgressTracker = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Toggle Play/Pause on explicit user click
  const handleTogglePlay = (e) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    try {
      if (browserBlockedAudio) {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setBrowserBlockedAudio(false);
        if (onToggleMute && isMuted) onToggleMute();
      }

      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {}
  };

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center select-none overflow-hidden cursor-pointer"
      onClick={handleTogglePlay}
    >
      {/* Black Mask until video starts */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none z-10 flex items-center justify-center ${
          videoStarted ? "opacity-0" : "opacity-100"
        }`}
      >
        {!hasError && (
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      {/* Error Fallback */}
      {hasError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900 via-black to-gray-950 text-center text-white">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mb-3 border border-rose-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            Video Unavailable
          </h4>
          <p className="text-xs text-gray-400 max-w-xs">
            Scroll to discover the next delicious dish.
          </p>
        </div>
      ) : (
        /* Full-Bleed 1.58x Scaler: Completely pushes all horizontal divider lines and YouTube chrome outside bounds */
        <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none">
          <div className="w-full h-full flex items-center justify-center transform scale-[1.58] origin-center">
            <div id={playerId} className="w-full h-full pointer-events-none" />
          </div>
        </div>
      )}

      {/* Tap for Sound Banner */}
      {browserBlockedAudio && isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (playerRef.current) {
              playerRef.current.unMute();
              playerRef.current.setVolume(100);
            }
            setBrowserBlockedAudio(false);
            if (onToggleMute && isMuted) onToggleMute();
          }}
          className="absolute top-5 left-5 z-30 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xl flex items-center space-x-1.5 animate-pulse border border-emerald-400/40 backdrop-blur-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
          <span>Tap for Sound</span>
        </button>
      )}

      {/* Persistent Snackr Pause Shield (Solidly masks YouTube's native bulky pause icon when paused) */}
      {!isPlaying && videoStarted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-all duration-200">
          <div className="w-18 h-18 rounded-full bg-[#0c0d12]/90 backdrop-blur-xl flex items-center justify-center text-white shadow-[0_0_35px_rgba(0,0,0,0.85)] border border-white/20 scale-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 ml-0.5 text-emerald-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelPlayer;
