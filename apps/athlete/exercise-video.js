/** Optional coach demo video: YouTube, mp4, or an external https link. */
(function (root) {
  const YT = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?.*?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i;

  function parse(raw) {
    const value = String(raw || '').trim();
    if (!value) return null;
    let url;
    try { url = new URL(value); } catch { return null; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const yt = value.match(YT);
    if (yt) {
      return {
        kind: 'youtube',
        videoId: yt[1],
        src: url.href,
        embedSrc: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`,
      };
    }
    if (/\.mp4(?:$|[?#])/i.test(url.pathname)) return {kind: 'mp4', src: url.href};
    return {kind: 'link', src: url.href};
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function buttonHtml(page) {
    const parsed = parse(page && (page.videoUrl || page.video_url));
    if (!parsed) return '';
    return `<button type="button" class="log-video-play" onclick="Logger.playVideo()" aria-label="Play exercise demo">▶ Play demo</button>`;
  }

  function playerHtml(page) {
    const parsed = parse(page && (page.videoUrl || page.video_url));
    if (!parsed) return '';
    const media = parsed.kind === 'youtube'
      ? `<iframe class="log-video-frame" src="${esc(parsed.embedSrc)}" title="Exercise demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : parsed.kind === 'mp4'
        ? `<video class="log-video-frame" src="${esc(parsed.src)}" controls playsinline></video>`
        : '';
    return `<div class="log-video-sheet" id="logVideoSheet">
      <div class="log-video-backdrop" onclick="Logger.closeVideo()"></div>
      <div class="log-video-panel" role="dialog" aria-label="Exercise demo">
        <div class="log-video-head">
          <strong>Exercise demo</strong>
          <button type="button" class="log-video-close" onclick="Logger.closeVideo()" aria-label="Close demo">×</button>
        </div>
        ${media}
        <a class="log-video-ext" href="${esc(parsed.src)}" target="_blank" rel="noopener noreferrer">Open externally</a>
      </div>
    </div>`;
  }

  root.ExerciseVideo = {parse, buttonHtml, playerHtml};
})(typeof globalThis !== 'undefined' ? globalThis : this);
