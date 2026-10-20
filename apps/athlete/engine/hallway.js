/* Strength is parked. This page no longer offers a walk back to it.
 * Engine keeps its own storage. */
(function (win) {
  win.switchHybridLocker = async function switchHybridLocker() {};

  const renderEngine = win.render;
  win.render = function () {
    renderEngine.apply(this, arguments);
  };
})(window);
