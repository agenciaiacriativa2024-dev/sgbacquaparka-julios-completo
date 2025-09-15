const CACHE_NAME = 'sgb-acquapark-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione aqui outros recursos estáticos que você queira cachear
  // Ex: '/styles/main.css', '/images/logo.png'
  // Como estamos usando CDNs, o cache de recursos de terceiros é gerenciado pelo navegador
  // e pelas políticas de cache do próprio CDN.
];

// Evento de instalação do Service Worker
self.addEventListener('install', event => {
  // Realiza a instalação e o cache dos arquivos estáticos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de ativação do Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Deleta caches antigos se existirem
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de fetch (intercepta as requisições de rede)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a resposta estiver no cache, retorna do cache
        if (response) {
          return response;
        }
        // Caso contrário, faz a requisição à rede
        return fetch(event.request);
      }
    )
  );
});
