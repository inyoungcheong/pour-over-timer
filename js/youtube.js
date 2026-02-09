/**
 * YouTube background music player module.
 * Player is visible by default. "I'm feeling lucky" button loads a random video.
 */
const YouTubePlayer = (() => {
  const playlist = [
    '8O24upr-QBQ',
    'tQR76JJnZL4',
    '6Z7bjN15SjI',
    'jeLlKfT0k-8',
    'uWA00WUEBvU',
    'LPYitViOM6o',
    'Adw-mu1KyAU',
    'OSH-GfuH0bo',
    'rralFeQ7aZs',
    'AsqyGaCT9wc',
    'p9dRg8yQ2DY',
    'ytg-n72EFWE',
    'eWmw0MptHIY',
    'WeHuoi_0mz8',
    'l4VxBwZ5ccg',
    'cDUpjMW2lK8',
    'Y02732H-tYU',
    'M__WZPd2r58',
    'Mbx56JNNeIw',
    'YnQjTW8AO8k',
    'c18tqLkN6Ho',
    'HiSaLVPl0J4',
    'x-ehWQmJZRA',
    'oTuq9PvIA8A',
  ];

  let player = null;
  let isPlayerVisible = true;
  let currentVideoId = null;

  function getRandomVideoId() {
    let newId;
    // Avoid picking the same video twice in a row
    do {
      newId = playlist[Math.floor(Math.random() * playlist.length)];
    } while (newId === currentVideoId && playlist.length > 1);
    currentVideoId = newId;
    return currentVideoId;
  }

  function init() {
    // Load the YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(tag, firstScript);

    const toggleBtn = document.getElementById('musicToggle');
    const luckyBtn = document.getElementById('musicLucky');
    const embedContainer = document.getElementById('musicPlayerEmbed');

    // Toggle visibility
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isPlayerVisible = !isPlayerVisible;
        embedContainer.style.display = isPlayerVisible ? 'block' : 'none';
        toggleBtn.setAttribute('aria-label', isPlayerVisible ? 'Hide music player' : 'Show music player');
      });
    }

    // I'm feeling lucky - load random video
    if (luckyBtn) {
      luckyBtn.addEventListener('click', () => {
        if (!player) return;
        const nextId = getRandomVideoId();
        player.loadVideoById(nextId);
        // Ensure player is visible
        if (!isPlayerVisible) {
          isPlayerVisible = true;
          embedContainer.style.display = 'block';
          toggleBtn.setAttribute('aria-label', 'Hide music player');
        }
      });
    }
  }

  function onAPIReady() {
    const videoId = getRandomVideoId();

    player = new YT.Player('ytPlayer', {
      height: '158',
      width: '280',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        loop: 1,
        playlist: videoId,
      },
      events: {
        onStateChange: onPlayerStateChange,
      },
    });
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
      const nextId = getRandomVideoId();
      player.loadVideoById(nextId);
    }
  }

  return { init, onAPIReady };
})();

// Global callback required by YouTube IFrame API
function onYouTubeIframeAPIReady() {
  YouTubePlayer.onAPIReady();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  YouTubePlayer.init();
});
