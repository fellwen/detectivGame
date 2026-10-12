/* Сообщение остаётся доступным даже при ошибке загрузки ES modules. */
(() => {
  const notice = document.getElementById('runtimeNotice');
  function show(text) {
    notice.className = 'answer-feedback incorrect mb-4';
    notice.textContent = text;
  }
  if (location.protocol === 'file:') {
    show('Откройте папку проекта в VS Code и запустите Live Server (Go Live). Либо выполните npm start и откройте http://localhost:8000. Открытие index.html двойным щелчком не поддерживается.');
    return;
  }
  setTimeout(() => {
    if (document.documentElement.dataset.gameReady !== 'true') {
      show('Материалы не загрузились. Убедитесь, что архив распакован полностью и сервер открыт из папки project_Avi. В консоли браузера будет указана причина ошибки.');
    }
  }, 5000);
})();
