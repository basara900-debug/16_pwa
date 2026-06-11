// Service Worker - 완전 오프라인 캐싱
const CACHE_NAME = 'l3-master-v1.2';
const CACHE_FILES = [
  './',
  './index.html',
  './react.min.js',
  './react-dom.min.js',
  './babel.min.js',
  'https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;600;700;900&display=swap'
];

// 설치: 모든 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] 캐시 설치 중...');
      return cache.addAll(CACHE_FILES.filter(f => !f.startsWith('http')));
    }).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 네트워크 요청: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // 완전 오프라인시 index.html 반환
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
