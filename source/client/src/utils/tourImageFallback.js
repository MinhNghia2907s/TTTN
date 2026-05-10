const fallbackSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img" aria-label="Ảnh tour đang cập nhật">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f6d7b5" />
        <stop offset="55%" stop-color="#f0a56b" />
        <stop offset="100%" stop-color="#274d73" />
      </linearGradient>
    </defs>
    <rect width="1200" height="750" fill="url(#bg)" />
    <circle cx="940" cy="150" r="72" fill="rgba(255,245,219,0.9)" />
    <path d="M0 580 L170 410 L330 540 L500 320 L720 570 L910 390 L1200 620 L1200 750 L0 750 Z" fill="rgba(255,255,255,0.18)" />
    <path d="M0 640 L210 500 L370 620 L580 430 L760 610 L980 470 L1200 650 L1200 750 L0 750 Z" fill="rgba(16,35,60,0.28)" />
    <text x="80" y="590" fill="#ffffff" font-family="Be Vietnam Pro, Arial, sans-serif" font-size="58" font-weight="700">
      Ảnh tour đang cập nhật
    </text>
    <text x="80" y="650" fill="rgba(255,255,255,0.88)" font-family="Be Vietnam Pro, Arial, sans-serif" font-size="30">
      Nội dung hành trình vẫn sẵn sàng để bạn tham khảo và đặt tour
    </text>
  </svg>
`;

export const TOUR_FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(fallbackSvg)}`;

/**
 * Đổi sang ảnh mặc định nếu ảnh từ nguồn ngoài không tải được.
 */
export function handleTourImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = TOUR_FALLBACK_IMAGE;
}
