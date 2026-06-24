const { createServer } = require('node:http');
const { createReadStream, existsSync, statSync } = require('node:fs');
const { extname, join, normalize, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (localError) {
    const candidates = [];
    if (process.env.NODE_PATH) {
      candidates.push(...process.env.NODE_PATH.split(process.platform === 'win32' ? ';' : ':'));
    }
    if (process.env.APPDATA) {
      candidates.push(join(process.env.APPDATA, 'npm', 'node_modules'));
    }
    candidates.push('/usr/local/lib/node_modules', '/usr/lib/node_modules');

    for (const candidate of candidates) {
      try {
        return require(join(candidate, 'playwright'));
      } catch (globalError) {}
    }

    throw localError;
  }
}

function startServer() {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === '/') pathname = '/index.html';

    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolveServer) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveServer({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

async function waitForGameReady(page) {
  await page.waitForFunction(() => {
    return window.game &&
      window.game.state &&
      window.game.state.currentMap &&
      window.game.dataManager?.get('meta');
  }, null, { timeout: 15000 });
}

async function clearBrowserState(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    localStorage.clear();
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  });
}

async function loadFresh(page, url) {
  await clearBrowserState(page, url);
  await page.goto(url, { waitUntil: 'networkidle' });
  await waitForGameReady(page);
}

async function clickCanvasPoint(page, point) {
  const rect = await page.evaluate(() => {
    const bounds = document.getElementById('gameCanvas').getBoundingClientRect();
    return { left: bounds.left, top: bounds.top };
  });
  await page.mouse.click(rect.left + point.x, rect.top + point.y);
}

async function clickLayoutButton(page, selector) {
  const button = await page.evaluate(selector);
  await clickCanvasPoint(page, {
    x: button.x + button.width / 2,
    y: button.y + button.height / 2
  });
}

async function expectState(page, predicate, label) {
  await page.waitForFunction(predicate, null, { timeout: 10000 }).catch((error) => {
    throw new Error(`${label}: ${error.message}`);
  });
}

async function expectPlayableLayout(page, label) {
  const result = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas').getBoundingClientRect();
    const hud = document.getElementById('htmlHud').getBoundingClientRect();
    const panel = document.getElementById('towerPanel').getBoundingClientRect();
    const hint = document.getElementById('hintBar').getBoundingClientRect();
    return {
      canvasHasPlayableArea: canvas.width >= 700 && canvas.height >= 600,
      hudAboveCanvas: hud.bottom <= canvas.top + 1,
      hudBeforePanel: hud.right <= panel.left,
      hintBelowCanvas: hint.top >= canvas.bottom - 1,
      hintBeforePanel: hint.right <= panel.left,
      panelAfterCanvas: panel.left >= canvas.right - 1,
      panelOnscreen: panel.right <= window.innerWidth && panel.bottom <= window.innerHeight,
      hudOnscreen: hud.left >= 0 && hud.top >= 0
    };
  });

  const failed = Object.entries(result).filter(([, ok]) => !ok).map(([key]) => key);
  if (failed.length > 0) {
    throw new Error(`${label}: layout checks failed: ${failed.join(', ')}`);
  }
}

async function run() {
  const { chromium } = loadPlaywright();
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const failures = [];

  page.on('pageerror', (error) => failures.push(`[pageerror] ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`[console:error] ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(url)) {
      failures.push(`[requestfailed] ${request.method()} ${request.url()} ${request.failure()?.errorText}`);
    }
  });
  page.on('dialog', async (dialog) => {
    failures.push(`[dialog:${dialog.type()}] ${dialog.message()}`);
    await dialog.dismiss();
  });

  try {
    await loadFresh(page, url);
    failures.length = 0;

    await page.click('#settingsButton');
    await expectState(page, () => window.game.state.showSettings, 'settings opens');
    await clickLayoutButton(page, () => window.game.ui.getSettingsLayout(
      window.game.canvas,
      window.game.settingsManager.state,
      window.game.localeManager
    ).backButton);
    await expectState(page, () => !window.game.state.showSettings && document.getElementById('startScreen').style.display === 'flex', 'settings returns to menu');

    await page.click('#tavernButton');
    await expectState(page, () => window.game.state.showTavern, 'tavern opens');
    await clickLayoutButton(page, () => window.game.ui.getTavernLayout(
      window.game.canvas,
      window.game.dataManager.get('meta'),
      window.game.metaManager,
      window.game.localeManager
    ).backButton);
    await expectState(page, () => !window.game.state.showTavern && document.getElementById('startScreen').style.display === 'flex', 'tavern returns to menu');

    await page.click('#editorButton');
    await expectState(page, () => window.game.state.showEditor && window.game.editorSystem, 'editor opens');
    await expectState(page, () => getComputedStyle(document.getElementById('htmlHud')).display === 'none' && getComputedStyle(document.getElementById('towerPanel')).display === 'none', 'editor hides gameplay chrome');
    await page.click('[data-editor-mode="enemies"]');
    await expectState(page, () => window.game.editorSystem.mode === 'enemies', 'editor tab changes');
    await page.click('[data-editor-action="exit"]');
    await expectState(page, () => !window.game.state.showEditor && document.getElementById('startScreen').style.display === 'flex', 'editor exits');

    await page.evaluate(async () => {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (!registration) throw new Error('service worker was not registered');
    });

    await page.click('#startButton');
    await expectState(page, () => window.game.state.isSetupPhase && !window.game.waveSystem.isWaiting, 'new game enters setup');
    await expectState(page, () => document.getElementById('startWaveButton').disabled, 'start wave disabled before placement');
    await expectPlayableLayout(page, 'setup layout');

    await clickCanvasPoint(page, { x: 120, y: 280 });
    await expectState(page, () => window.game.towerManager.placedTowers.length === 1, 'tower placement');
    await expectState(page, () => !document.getElementById('startWaveButton').disabled, 'start wave enabled after placement');

    await page.click('#startWaveButton');
    await expectState(page, () => window.game.state.gameRunning && window.game.waveSystem.isWaiting && !window.game.state.isSetupPhase, 'start wave begins countdown');
    await clickLayoutButton(page, () => window.game.ui.getWaveCountdownLayout(window.game.canvas, window.game.localeManager).button);
    await page.waitForFunction(() => !window.game.waveSystem.isWaiting, null, { timeout: 10000 });

    await page.evaluate(() => {
      const game = window.game;
      game.waveSystem.enemiesSpawned = game.waveSystem.enemiesToSpawn;
      game.state.enemies = [];
      game.updateLogic(1000 / 60);
    });
    await expectState(page, () => window.game.state.showCamp, 'wave completion opens camp');
    await page.evaluate(() => {
      const game = window.game;
      const before = {
        currentWave: game.waveSystem.currentWave,
        enemiesSpawned: game.waveSystem.enemiesSpawned,
        enemies: game.state.enemies.length
      };

      for (let i = 0; i < 120; i++) {
        game.updateLogic(1000 / 60);
      }

      if (!game.state.showCamp || game.state.gameRunning || game.waveSystem.isWaiting) {
        throw new Error('camp did not pause the run after wave completion');
      }
      if (game.waveSystem.currentWave !== before.currentWave ||
        game.waveSystem.enemiesSpawned !== before.enemiesSpawned ||
        game.state.enemies.length !== before.enemies) {
        throw new Error('wave advanced while camp was open');
      }
    });
    await page.evaluate(() => {
      const game = window.game;
      const layout = game.ui.getCampLayout(game.canvas, game.state, game.dataManager, game.localeManager);
      const expectedCenter = game.canvas.width / 2;
      const actualCenter = layout.modal.x + layout.modal.width / 2;
      if (Math.abs(actualCenter - expectedCenter) > 1) {
        throw new Error('camp modal is not centered in the visible canvas');
      }
      if (layout.tabs.some((tab) => tab.label === 'camp_party')) {
        throw new Error('camp party tab is missing a localized label');
      }
    });

    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('towers_current_run') || 'null');
      if (!saved || saved.runData.currentWave !== 2 || saved.runData.towers.length !== 1) {
        throw new Error('autosave did not capture the completed run state');
      }
    });

    await page.reload({ waitUntil: 'networkidle' });
    await waitForGameReady(page);
    await page.waitForSelector('#continueButton', { state: 'visible', timeout: 10000 });
    await page.click('#continueButton');
    await expectState(page, () => window.game.state.showCamp && !window.game.state.gameRunning && window.game.towerManager.placedTowers.length === 1, 'saved run continues into paused camp');

    await clickLayoutButton(page, () => window.game.ui.getCampLayout(
      window.game.canvas,
      window.game.state,
      window.game.dataManager,
      window.game.localeManager
    ).nextWaveButton);
    await expectState(page, () => !window.game.state.showCamp && window.game.state.isSetupPhase && !window.game.waveSystem.isWaiting, 'camp returns to setup');
    await expectState(page, () => getComputedStyle(document.getElementById('startWaveButton')).display !== 'none' && !document.getElementById('startWaveButton').disabled, 'next wave start button is available');
    await page.click('#settingsHudButton');
    await expectState(page, () => window.game.state.showSettings, 'settings opens during setup');
    await clickLayoutButton(page, () => window.game.ui.getSettingsLayout(
      window.game.canvas,
      window.game.settingsManager.state,
      window.game.localeManager
    ).backButton);
    await expectState(page, () => !window.game.state.showSettings && window.game.state.isSetupPhase && document.getElementById('gameShell').classList.contains('active'), 'settings returns to setup');
    await page.click('#startWaveButton');
    await expectState(page, () => window.game.state.gameRunning && window.game.waveSystem.isWaiting && !window.game.state.isSetupPhase, 'next wave starts only after confirmation');

    await page.evaluate(async () => {
      const game = window.game;
      const { Config } = await import('/src/game/core/Config.js');

      game.waveSystem.currentWave = 6;
      game.updateCurrentMap();
      game.state.enemies = [];

      const originalRandom = Math.random;
      Math.random = () => 0.99;
      game.waveSystem.spawnEnemy(game.state, game.dataManager);
      Math.random = originalRandom;

      const spawned = game.state.enemies.pop();
      if (spawned.path !== game.state.currentMap.paths[1]) {
        throw new Error('split-path spawning did not use currentMap.paths');
      }

      game.waveSystem.currentWave = 1;
      game.updateCurrentMap();
      game.state.enemies = [];
      game.waveSystem.spawnEnemy(game.state, game.dataManager);
      const enemy = game.state.enemies[0];
      const hazard = game.state.currentMap.hazards[0];
      enemy.x = hazard.x * Config.gridSize + Config.gridSize / 2;
      enemy.y = hazard.y * Config.gridSize + Config.gridSize / 2;
      enemy.checkHazards(game.state);

      if (!enemy.activeEffects.has(hazard.type)) {
        throw new Error('hazards did not read currentMap from game state');
      }
    });

    if (failures.length > 0) {
      throw new Error(failures.join('\n'));
    }

    console.log('Smoke OK: menu, settings, tavern, editor, PWA, placement, wave, camp, save/load, maps');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
