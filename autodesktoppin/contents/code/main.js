const screenIDX11 = readConfig("ScreenIDX11", "1").split(/,\s*/).map(parseInt);
const screenIDWL = readConfig("ScreenIDWL", "1").split(/,\s*/).map(parseInt);
print('ScreenIDX11: ', screenIDX11);
print('ScreenIDWL: ', screenIDWL);

var isWayland = false;

function bind(window) {
  window.previousScreen = window.screen;
  window.screenChanged.connect(window, update);
  window.desktopChanged.connect(window, update);
  print("Window " + window.windowId + " has been bound");
}

function shouldPinOnScreen(id) {
  var result = false;
  if(isWayland) {
    screenIDWL.forEach((x) => { result |= x == id;});
  } else {
    screenIDX11.forEach((x) => { result |= x == id;});
  }
  return result;
}

function update(window) {
  var window = window || this;

  if (window.desktopWindow || window.dock || (!window.normalWindow && window.skipTaskbar)) {
    return;
  }

  var currentScreen = window.screen;
  var previousScreen = window.previousScreen;
  window.previousScreen = currentScreen;

  if (shouldPinOnScreen(currentScreen)) {
    window.desktop = -1;
    print("Window has been pinned");
  } else if (shouldPinOnScreen(previousScreen)) {
    window.desktop = workspace.currentDesktop;
    print("Window has been unpinned");
  }
}

function bindUpdate(window) {
  bind(window);
  update(window);
}

function main() {
  workspace.clientList().forEach(bind);
  workspace.clientList().forEach(update);
  workspace.clientAdded.connect(bindUpdate);
}

callDBus(
  'org.kde.plasmashell', '/MainApplication', 'org.freedesktop.DBus.Properties',
  'Get', 'org.qtproject.Qt.QGuiApplication', 'platformName',
  (value) => {
    if(value == 'wayland') {
      print('Desktop is Wayland');
      isWayland = true;
    }
    else {
      print('Desktop is not wayland');
      isWayland = false;
    }
    main();  
  }
);
