/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setIntro } from "../utils/featureSlice";

const IframeVideoPlayer = ({
  movieId,
  movieType,
  season = null,
  episode = null,
  onClose,
  showIntro = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    // Stop all background audio when video player opens
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    const iframes = document.querySelectorAll('iframe[src*="youtube"]');
    
    videos.forEach(video => {
      video.pause();
      video.currentTime = 0;
      video.muted = true;
    });
    
    audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = true;
    });
    
    // Stop YouTube players permanently
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
      } catch (e) {
        // Ignore cross-origin errors
      }
    });
    
    // Show intro animation if requested
    if (showIntro) {
      dispatch(setIntro(true));
      
      // Show video player immediately, intro plays as overlay
      setIsLoading(false);
      
      // Hide intro after animation completes
      const introTimeout = setTimeout(() => {
        dispatch(setIntro(false));
      }, 5500);

      return () => clearTimeout(introTimeout);
    } else {
      setIsLoading(false);
    }
  }, [showIntro, dispatch]);

  useEffect(() => {
    // Construct the video URL based on type
    let url = "";
    if (movieType === "movie") {
      url = `https://apimocine.vercel.app/movie/${movieId}`;
    } else if (movieType === "tv" && season && episode) {
      url = `https://apimocine.vercel.app/tv/${movieId}/${season}/${episode}`;
    }
    setVideoUrl(url);
  }, [movieId, movieType, season, episode]);

  const handleClose = () => {
    // Don't resume background audio when closing video player
    // User should manually restart trailers if needed
    if (onClose) {
      onClose();
    }
  };

  // Handle escape key to close player
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  // Don't show loading screen, show video player immediately

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-[101] bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
        aria-label="Close video player"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Video iframe */}
      {videoUrl && (
        <iframe
          src={videoUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          title="Video Player"
        />
      )}
    </div>
  );
};

export default IframeVideoPlayer;