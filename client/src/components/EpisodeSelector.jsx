/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "axios";

const EpisodeSelector = ({ movieId, onEpisodeSelect, onClose }) => {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pause all trailer audio when episode selector opens
  useEffect(() => {
    // Find all video elements and pause them
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    const iframes = document.querySelectorAll('iframe[src*="youtube"]');
    
    videos.forEach(video => {
      if (!video.paused) {
        video.pause();
        video.setAttribute('data-was-playing', 'true');
      }
    });
    
    audios.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.setAttribute('data-was-playing', 'true');
      }
    });
    
    // Pause YouTube players via postMessage
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } catch (e) {
        // Ignore cross-origin errors
      }
    });
    
    return () => {
      // Resume audio when component unmounts (if user closes without selecting)
      videos.forEach(video => {
        if (video.getAttribute('data-was-playing') === 'true') {
          video.play();
          video.removeAttribute('data-was-playing');
        }
      });
      
      audios.forEach(audio => {
        if (audio.getAttribute('data-was-playing') === 'true') {
          audio.play();
          audio.removeAttribute('data-was-playing');
        }
      });
    };
  }, []);

  useEffect(() => {
    fetchTVDetails();
  }, [movieId]);

  useEffect(() => {
    if (selectedSeason && seasons.length > 0) {
      fetchSeasonDetails(selectedSeason);
    }
  }, [selectedSeason, seasons]);

  const fetchTVDetails = async () => {
    try {
      // Show modal immediately, load data in background
      setLoading(false);
      
      const config = {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_TMDB_AUTH}`
        }
      };

      const response = await axios.get(
        `https://api.themoviedb.org/3/tv/${movieId}`,
        config
      );

      if (response.data && response.data.seasons) {
        // Filter out season 0 (specials) and invalid seasons
        const validSeasons = response.data.seasons.filter(
          (season) => season.season_number > 0 && season.episode_count > 0
        );
        setSeasons(validSeasons);
        if (validSeasons.length > 0) {
          setSelectedSeason(validSeasons[0].season_number);
        }
      }
    } catch (err) {
      console.error("Error fetching TV details:", err);
      setError("Failed to load TV show details");
    }
  };

  const fetchSeasonDetails = async (seasonNumber) => {
    try {
      const config = {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_TMDB_AUTH}`
        }
      };

      const response = await axios.get(
        `https://api.themoviedb.org/3/tv/${movieId}/season/${seasonNumber}`,
        config
      );

      if (response.data && response.data.episodes) {
        setEpisodes(response.data.episodes);
      }
    } catch (err) {
      console.error("Error fetching season details:", err);
      setError("Failed to load episodes");
    }
  };

  const handleEpisodeClick = (episodeNumber) => {
    // Stop all background audio permanently when episode is selected
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    const iframes = document.querySelectorAll('iframe[src*="youtube"]');
    
    videos.forEach(video => {
      video.pause();
      video.currentTime = 0;
    });
    
    audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    // Stop YouTube players
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
      } catch (e) {
        // Ignore cross-origin errors
      }
    });
    
    onEpisodeSelect(selectedSeason, episodeNumber);
  };

  const handleClose = () => {
    // Resume trailer audio when closing without selection
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    
    videos.forEach(video => {
      if (video.getAttribute('data-was-playing') === 'true') {
        video.play();
        video.removeAttribute('data-was-playing');
      }
    });
    
    audios.forEach(audio => {
      if (audio.getAttribute('data-was-playing') === 'true') {
        audio.play();
        audio.removeAttribute('data-was-playing');
      }
    });
    
    if (onClose) {
      onClose();
    }
  };

  // Show modal immediately with loading state inside

  if (error) {
    return (
      <div className="fixed inset-0 z-[95] bg-black bg-opacity-80 flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-lg text-white max-w-md">
          <h3 className="text-xl font-bold mb-4">Error</h3>
          <p className="mb-4">{error}</p>
          <button
            onClick={handleClose}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[95] bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Select Episode</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Season selector */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Season</h3>
          <div className="flex flex-wrap gap-2">
            {seasons.length > 0 ? (
              seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => setSelectedSeason(season.season_number)}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedSeason === season.season_number
                      ? "bg-red-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Season {season.season_number}
                </button>
              ))
            ) : (
              <div className="text-gray-400 text-sm">Loading seasons...</div>
            )}
          </div>
        </div>

        {/* Episodes list */}
        <div className="p-6 overflow-y-auto max-h-96">
          <h3 className="text-lg font-semibold text-white mb-3">
            Episodes - Season {selectedSeason}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {episodes.length > 0 ? (
              episodes.map((episode) => (
                <div
                  key={episode.episode_number}
                  onClick={() => handleEpisodeClick(episode.episode_number)}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    {episode.still_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${episode.still_path}`}
                        alt={episode.name}
                        className="w-16 h-10 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium group-hover:text-red-400 transition-colors truncate">
                        {episode.episode_number}. {episode.name}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {episode.runtime ? `${episode.runtime}m` : ""}
                      </p>
                      {episode.overview && (
                        <p className="text-gray-300 text-xs mt-2 line-clamp-2">
                          {episode.overview}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-8">
                {seasons.length > 0 ? "Loading episodes..." : "Loading..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpisodeSelector;