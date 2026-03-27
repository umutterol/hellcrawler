"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.swInit = exports.client = exports.sendLogToRenderer = exports.getOptimizedGPUFlags = exports.mainWindow = exports.MAX_CANVAS_HEIGHT_STEP = exports.MIN_CANVAS_HEIGHT_STEP = exports.DEFAULT_CANVAS_HEIGHT_STEP = exports.BASE_CANVAS_HEIGHT = void 0;
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const sw = __importStar(require("@telazer/steamworks"));
const electron_store_1 = __importDefault(require("electron-store"));
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const zlib_1 = __importDefault(require("zlib"));
const electron_2 = require("electron");
dotenv.config();
exports.BASE_CANVAS_HEIGHT = 104;
exports.DEFAULT_CANVAS_HEIGHT_STEP = 3;
exports.MIN_CANVAS_HEIGHT_STEP = 2;
exports.MAX_CANVAS_HEIGHT_STEP = 10;
let storeData = {
    heightStep: exports.DEFAULT_CANVAS_HEIGHT_STEP,
    activeMonitor: 0,
    alwaysOnTop: true,
    shareProtection: false,
    ignoreMouseEvents: false,
    // visibleOnAllWorkspaces: true,
};
// TODO In the macos top menu bar title is updated on the info.plist file
// https://stackoverflow.com/a/76711977
electron_1.app.setName('Desktop Heroes');
(_a = electron_1.app.dock) === null || _a === void 0 ? void 0 : _a.show();
electron_1.Menu.setApplicationMenu(null);
if (process.platform === 'linux') {
    electron_1.app.commandLine.appendSwitch('no-sandbox');
}
exports.mainWindow = null;
let allowRepositioning = false;
function getOptimizedGPUFlags() {
    const isMac = process.platform === 'darwin';
    const isWindows = process.platform === 'win32';
    const isLinux = process.platform === 'linux';
    const common = [
        '--enable-gpu-rasterization',
        '--ignore-gpu-blacklist',
        '--enable-zero-copy',
        '--enable-accelerated-video-decode',
        '--force_high_performance_gpu',
    ];
    // prettier-ignore
    const macFlags = [
        '--use-angle=metal',
        '--enable-features=CanvasOopRasterization'
    ];
    const windowsFlags = [
        '--use-gl=desktop',
        '--enable-features=CanvasOopRasterization,Vulkan',
        '--enable-oop-rasterization',
        '--enable-native-gpu-memory-buffers',
    ];
    const linuxFlags = [
        '--use-gl=desktop',
        '--enable-features=CanvasOopRasterization,Vulkan',
        '--enable-oop-rasterization',
        '--enable-native-gpu-memory-buffers',
    ];
    if (isMac)
        return [...common, ...macFlags];
    if (isWindows)
        return [...common, ...windowsFlags];
    if (isLinux)
        return [...common, ...linuxFlags];
    return common;
}
exports.getOptimizedGPUFlags = getOptimizedGPUFlags;
function createWindow() {
    exports.mainWindow = new electron_1.BrowserWindow({
        frame: false,
        titleBarStyle: 'customButtonsOnHover',
        trafficLightPosition: { x: -100, y: -100 },
        transparent: true,
        backgroundColor: '#00000000',
        fullscreenable: false,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false,
            additionalArguments: getOptimizedGPUFlags(),
        },
    });
    placeAppToDisplay(storeData.activeMonitor);
    exports.mainWindow.setAlwaysOnTop(storeData.alwaysOnTop);
    exports.mainWindow.setContentProtection(storeData.shareProtection);
    exports.mainWindow.setIgnoreMouseEvents(storeData.ignoreMouseEvents, { forward: true });
    // mainWindow.setVisibleOnAllWorkspaces(storeData.visibleOnAllWorkspaces, { visibleOnFullScreen: true });
    exports.mainWindow.on('move', () => {
        if (!allowRepositioning) {
            sendLogToRenderer('info', 'Window moved');
            placeAppToDisplay(storeData.activeMonitor, true);
        }
    });
    exports.mainWindow.on('resize', () => {
        if (!allowRepositioning) {
            sendLogToRenderer('info', 'Window resized');
            placeAppToDisplay(storeData.activeMonitor, true);
        }
    });
    electron_1.screen.on('display-added', (event, newDisplay) => {
        sendLogToRenderer('info', 'Display added:', newDisplay);
        placeAppToDisplay(storeData.activeMonitor, true);
    });
    electron_1.screen.on('display-removed', (event, oldDisplay) => {
        sendLogToRenderer('info', 'Display removed:', oldDisplay);
        placeAppToDisplay(storeData.activeMonitor, true);
    });
    electron_1.screen.on('display-metrics-changed', (event, display, changedMetrics) => {
        sendLogToRenderer('info', 'Display metrics changed:', display, changedMetrics);
        if (changedMetrics.includes('bounds')) {
            placeAppToDisplay(storeData.activeMonitor, true);
        }
    });
    if (electron_1.app.isPackaged) {
        // Fix path to index.html - go up one directory from __dirname (electron/) to the build root
        const indexPath = path_1.default.join(__dirname, '..', 'index.html');
        exports.mainWindow.loadFile(indexPath);
        swInit();
    }
    else {
        exports.mainWindow.loadURL('http://localhost:8080');
        swInit();
        exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.webContents.toggleDevTools();
        electron_1.globalShortcut.register('F12', () => {
            exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.webContents.toggleDevTools();
        });
    }
}
electron_1.app.whenReady().then(() => {
    // console.info(JSON.stringify(app.getGPUFeatureStatus(), null, 2));
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    // powerMonitor.on('suspend', () => sendLogToRenderer('info', 'Sleep mode'));
    // powerMonitor.on('resume', () => sendLogToRenderer('info', 'Woke up'));
    // powerMonitor.on('shutdown', (e) => {
    //   e.preventDefault(); // optional
    //   sendLogToRenderer('info', 'System shutting down');
    // });
    // powerMonitor.on('on-ac', () => sendLogToRenderer('info', 'On AC power'));
    // powerMonitor.on('on-battery', () => sendLogToRenderer('info', 'On battery power'));
    // powerMonitor.on('lock-screen', () => sendLogToRenderer('info', 'Screen locked'));
    // powerMonitor.on('unlock-screen', () => sendLogToRenderer('info', 'Screen unlocked'));
});
// app.on('before-quit', () => {
//   sendLogToRenderer('info', 'Electron app will quit');
//
//   mainWindow?.webContents?.send('appClosed');
// });
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
electron_1.ipcMain.on('app-quit', () => {
    electron_1.app.quit();
});
// Handle the 'circle' event to cycle through displays
electron_1.ipcMain.on('circle', () => {
    try {
        if (!exports.mainWindow) {
            sendLogToRenderer('error', 'Main window not initialized');
            return;
        }
        const displays = electron_1.screen.getAllDisplays();
        if (displays.length <= 1) {
            sendLogToRenderer('info', 'Only one display available, cannot cycle');
            return;
        }
        const currentDisplayIndex = getActiveDisplayIndex();
        const nextDisplayIndex = (currentDisplayIndex + 1) % displays.length;
        sendLogToRenderer('info', `Sawp screen command received, Current display index: ${currentDisplayIndex}, Next display index: ${nextDisplayIndex}`);
        placeAppToDisplay(nextDisplayIndex, true);
        sendLogToRenderer('info', `Moved to display ${nextDisplayIndex} of ${displays.length}`);
    }
    catch (error) {
        const err = error;
        sendLogToRenderer('error', 'Error cycling displays:', err.message);
    }
});
electron_1.ipcMain.on('dev-console', () => {
    exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.webContents.toggleDevTools();
});
electron_1.ipcMain.on('open-external', (event, url) => {
    electron_2.shell.openExternal(url);
});
electron_1.ipcMain.on('displayCount', (event) => {
    event.returnValue = electron_1.screen.getAllDisplays().length;
});
function placeAppToDisplay(displayIndex, forceSetHeightPercentage = false) {
    const displays = electron_1.screen.getAllDisplays();
    if (displayIndex > displays.length - 1) {
        storeData.heightStep = exports.DEFAULT_CANVAS_HEIGHT_STEP;
        displayIndex = 0;
    }
    if (forceSetHeightPercentage) {
        storeData.heightStep = exports.DEFAULT_CANVAS_HEIGHT_STEP;
    }
    sendLogToRenderer('info', `Placing app to display ${displayIndex} of ${displays.length}`);
    storeData.activeMonitor = displayIndex;
    setAppData();
    let display = displays[displayIndex];
    const { width, height, x, y } = display.workArea;
    const newMaxStep = Math.floor(Math.floor(height / 2) / exports.BASE_CANVAS_HEIGHT);
    if (newMaxStep !== exports.MAX_CANVAS_HEIGHT_STEP) {
        sendLogToRenderer('info', `Max canvas height step changed: ${exports.MAX_CANVAS_HEIGHT_STEP} -> ${newMaxStep}`);
        exports.MAX_CANVAS_HEIGHT_STEP = newMaxStep;
        setAppData();
        placeAppToDisplay(displayIndex, forceSetHeightPercentage);
        return;
    }
    if (storeData.heightStep > exports.MAX_CANVAS_HEIGHT_STEP) {
        sendLogToRenderer('info', `Height step is too high: ${storeData.heightStep}, setting to max: ${exports.MAX_CANVAS_HEIGHT_STEP}`);
        storeData.heightStep = exports.MAX_CANVAS_HEIGHT_STEP;
        setAppData();
        placeAppToDisplay(displayIndex);
        return;
    }
    const windowHeight = Math.floor(exports.BASE_CANVAS_HEIGHT * storeData.heightStep);
    allowRepositioning = true;
    exports.mainWindow.setBounds({
        width: width,
        height: windowHeight,
        x: x,
        y: y + height - windowHeight,
    });
    setTimeout(() => {
        allowRepositioning = false;
    }, 100);
}
function getActiveDisplayIndex() {
    const displays = electron_1.screen.getAllDisplays();
    const currentPosition = exports.mainWindow.getBounds();
    let currentDisplayIndex = 0;
    for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        const { x, y, width, height } = display.bounds;
        if (currentPosition.x >= x &&
            currentPosition.x < x + width &&
            currentPosition.y >= y &&
            currentPosition.y < y + height) {
            currentDisplayIndex = i;
            break;
        }
    }
    return currentDisplayIndex;
}
let intervalPointer = null;
electron_1.ipcMain.on('toggleClickThrough', (event, ignore) => {
    sendLogToRenderer('info', `Toggling ignore mouse events: ${ignore}`);
    exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
    if (intervalPointer) {
        clearInterval(intervalPointer);
    }
    if (ignore && exports.mainWindow) {
        let inside = false;
        intervalPointer = setInterval(() => {
            var _a;
            if ((exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.isDestroyed()) || !(exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.isVisible())) {
                return;
            }
            const { x, y, width, height } = exports.mainWindow.getBounds();
            const p = electron_1.screen.getCursorScreenPoint();
            const isInside = p.x >= x && p.x < x + width && p.y >= y && p.y < y + height;
            if (isInside !== inside) {
                inside = isInside;
                sendLogToRenderer('info', 'Mouse is inside:', inside);
                (_a = exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.webContents) === null || _a === void 0 ? void 0 : _a.send('clickTroughMouseEvent', {
                    mouseEnter: inside,
                    mouseLeave: !inside,
                });
            }
        }, 50);
    }
});
electron_1.ipcMain.on('toggleAlwaysOnTop', (event, isEnabled) => {
    sendLogToRenderer('info', `Toggling always on top: ${isEnabled}`);
    storeData.alwaysOnTop = isEnabled;
    setAppData();
    exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.setAlwaysOnTop(isEnabled);
});
electron_1.ipcMain.on('toggleShareProtection', (event, isEnabled) => {
    sendLogToRenderer('info', `Toggling share protection: ${isEnabled}`);
    storeData.shareProtection = isEnabled;
    setAppData();
    exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.setContentProtection(isEnabled);
});
// ipcMain.on('toggleAllWorkspaceVisible', (event, isEnabled: boolean) => {
//   sendLogToRenderer('info', `Toggling share protection: ${isEnabled}`);
//
//   storeData.visibleOnAllWorkspaces = isEnabled;
//   setAppData();
//
//   mainWindow?.setVisibleOnAllWorkspaces(isEnabled, { visibleOnFullScreen: true });
// });
electron_1.ipcMain.on('changeHeight', (event, stepChange) => {
    const nextStep = Math.max(exports.MIN_CANVAS_HEIGHT_STEP, Math.min(exports.MAX_CANVAS_HEIGHT_STEP, Math.floor(storeData.heightStep + stepChange)));
    storeData.heightStep = nextStep;
    placeAppToDisplay(storeData.activeMonitor);
    event.returnValue = nextStep;
});
const store = new electron_store_1.default();
storeData = lodash_1.default.merge({}, storeData, store.get('com.telazer.games.desktop_heroes_app') || {});
function setAppData() {
    store.set('com.telazer.games.desktop_heroes_app', storeData);
}
electron_1.ipcMain.on('readStoreSync', (event, filePath) => {
    var _a;
    try {
        let data = null;
        let storeStr = null;
        switch (process.env.PLATFORM) {
            case 'dev':
                const targetPath = path_1.default.join(process.cwd(), addPrefix(filePath));
                if (fs_1.default.existsSync(targetPath)) {
                    data = fs_1.default.readFileSync(targetPath, 'utf-8');
                }
                break;
            case 'electron':
            default:
                data = store.get(addPrefix(filePath));
                break;
        }
        let parsedData = null;
        if (data) {
            parsedData = JSON.parse(data);
            // @ts-expect-error - type shit
            storeStr = JSON.stringify(parsedData === null || parsedData === void 0 ? void 0 : parsedData.store);
        }
        const steamFilePath = convertToSteamPath(addPrefix(filePath));
        if ((_a = exports.client === null || exports.client === void 0 ? void 0 : exports.client.cloud) === null || _a === void 0 ? void 0 : _a.fileExists(steamFilePath)) {
            const cloudData = exports.client.cloud.readFile(steamFilePath);
            const parsedCloudData = JSON.parse(cloudData || '{}');
            sendLogToRenderer('info', 'Cloud data:', parsedCloudData);
            // @ts-expect-error - type shit
            if ((parsedCloudData.timestamp || 0) > ((parsedData === null || parsedData === void 0 ? void 0 : parsedData.timestamp) || 0)) {
                writeData(filePath, parsedCloudData.store, true, false);
                storeStr = JSON.stringify(parsedCloudData.store);
            }
            else {
                writeData(filePath, storeStr ? JSON.parse(storeStr) : null, false, true);
            }
        }
        event.returnValue = { data: storeStr ? JSON.stringify(decompressData(storeStr)) : storeStr, error: null };
    }
    catch (error) {
        const err = error;
        sendLogToRenderer('error', 'Error reading file:', err.message);
        event.returnValue = { data: null, error: 'Error reading file: ' + err.message };
    }
});
electron_1.ipcMain.on('writeStore', (event, filePath, data) => {
    try {
        writeData(filePath, data, true, true);
    }
    catch (error) {
        const err = error;
        sendLogToRenderer('error', 'Error writing file:', err.message);
    }
});
electron_1.ipcMain.on('getAppStore', (event) => {
    event.returnValue = storeData;
});
// Save arbitrary string content to a user-selected file via native dialog
electron_1.ipcMain.handle('saveFile', (_event, args) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { defaultFileName, content, filters } = args || {};
        const { canceled, filePath } = yield electron_1.dialog.showSaveDialog(exports.mainWindow, {
            title: 'Save File',
            defaultPath: defaultFileName,
            filters,
        });
        if (canceled || !filePath) {
            return { success: false };
        }
        fs_1.default.writeFileSync(filePath, content, 'utf-8');
        return { success: true, filePath };
    }
    catch (error) {
        const err = error;
        sendLogToRenderer('error', 'Error saving file:', err.message);
        return { success: false, error: err.message };
    }
}));
// Save JSON to a user-selected file via native dialog
electron_1.ipcMain.handle('saveJsonToFile', (_event, args) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { defaultFileName, json } = args || {};
        const { canceled, filePath } = yield electron_1.dialog.showSaveDialog(exports.mainWindow, {
            title: 'Export JSON',
            defaultPath: defaultFileName,
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });
        if (canceled || !filePath) {
            return { success: false };
        }
        fs_1.default.writeFileSync(filePath, json, 'utf-8');
        return { success: true, filePath };
    }
    catch (error) {
        const err = error;
        sendLogToRenderer('error', 'Error exporting JSON:', err.message);
        return { success: false, error: err.message };
    }
}));
function writeData(filePath, data, isLocal, isCloud) {
    const saveData = {
        timestamp: Date.now(),
        store: compressData(data),
    };
    if (isLocal) {
        switch (process.env.PLATFORM) {
            case 'dev':
                sendLogToRenderer('info', 'LOCAL FILE WRITE');
                const targetPath = path_1.default.join(process.cwd(), addPrefix(filePath));
                fs_1.default.writeFileSync(targetPath, process.env.DONT_COMPRESS_DATA === 'true'
                    ? JSON.stringify(Object.assign(Object.assign({}, saveData), { store: data }), null, 2)
                    : JSON.stringify(saveData));
                break;
            case 'electron':
            default:
                sendLogToRenderer('info', 'ELECTRON FILE WRITE');
                store.set(addPrefix(filePath), JSON.stringify(saveData));
                break;
        }
    }
    if (isCloud) {
        const steamFilePath = convertToSteamPath(addPrefix(filePath));
        const saveStatus = exports.client === null || exports.client === void 0 ? void 0 : exports.client.cloud.writeFile(steamFilePath, JSON.stringify(saveData));
        sendLogToRenderer('info', 'Cloud file write save status:', saveStatus);
    }
}
function addPrefix(filePath) {
    const converted = `${exports.client ? exports.client.localplayer.getSteamId().steamId64 + '-' : ''}${filePath}`;
    return converted;
}
function convertToSteamPath(filePath) {
    const converted = filePath.replace(/[-.]/gi, '');
    return converted;
}
function compressData(data) {
    const jsonString = JSON.stringify(data);
    const buffer = Buffer.from(jsonString, 'utf-8');
    const compressed = zlib_1.default.deflateSync(buffer);
    return compressed.toString('base64');
}
function decompressData(compressedData) {
    if (!compressedData || typeof compressedData !== 'string' || !compressedData.includes('eJ')) {
        return JSON.parse(compressedData);
    }
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressed = zlib_1.default.inflateSync(buffer);
    const json = JSON.parse(decompressed.toString('utf-8'));
    return json;
}
let isReadyToSendLogs = false;
// eslint-disable-next-line
const notSentLogs = [];
// Function to send logs to renderer process instead of console.info
// eslint-disable-next-line
function sendLogToRenderer(level, message, ...args) {
    var _a;
    if (!isReadyToSendLogs) {
        notSentLogs.push({ level, message, args });
    }
    if (process.env.LOG === 'true') {
        (_a = exports.mainWindow === null || exports.mainWindow === void 0 ? void 0 : exports.mainWindow.webContents) === null || _a === void 0 ? void 0 : _a.send('log-message', { level, message, args });
    }
}
exports.sendLogToRenderer = sendLogToRenderer;
electron_1.ipcMain.on('readyForLogs', () => {
    isReadyToSendLogs = true;
    // Send all not sent logs
    notSentLogs.forEach(({ level, message, args }) => {
        sendLogToRenderer(level, message, ...args);
    });
    notSentLogs.length = 0; // Clear the array
});
exports.client = null;
let achNames = [];
function swInit() {
    try {
        sendLogToRenderer('info', 'Initializing Steam...');
        // GAME 3734200
        // DEMO 3932680
        exports.client = sw.init(3734200);
        achNames = exports.client.achievement.names();
        sendLogToRenderer('info', 'Steam integration successful');
    }
    catch (error) {
        sendLogToRenderer('error', 'Failed to initialize Steam:', error);
    }
}
exports.swInit = swInit;
electron_1.ipcMain.on('steamAchivementUnlock', (event, achName) => {
    if (!exports.client) {
        return;
    }
    sendLogToRenderer('info', `Unlocking achievement: ${achName}`);
    if (!achNames.includes(achName)) {
        return;
    }
    if (!exports.client.achievement.isActivated(achName)) {
        exports.client.achievement.activate(achName);
    }
});
electron_1.ipcMain.on('steamStatIncrement', (event, statName) => {
    if (!exports.client) {
        return;
    }
    sendLogToRenderer('info', `incrementing: ${statName}`);
    const previousValue = exports.client.stats.getInt(statName) || 0;
    exports.client.stats.setInt(statName, previousValue + 1);
    exports.client.stats.store();
});
electron_1.ipcMain.on('steamStatSet', (event, statName, value) => {
    if (!exports.client) {
        return;
    }
    sendLogToRenderer('info', `setting: ${statName} to ${value}`);
    exports.client.stats.setInt(statName, value);
    exports.client.stats.store();
});
electron_1.ipcMain.on('steamPageOpen', () => {
    if (!exports.client) {
        return;
    }
    exports.client.overlay.activateToStore(3734200, 0 /* StoreFlag.None */);
});
electron_1.ipcMain.on('steamDlcPageOpen', () => {
    if (!exports.client) {
        return;
    }
    exports.client.overlay.activateToStore(4084080, 0 /* StoreFlag.None */);
});
electron_1.ipcMain.on('steamStatsAchiementsReset', () => {
    if (!exports.client) {
        return;
    }
    exports.client.stats.resetAll(true);
});
electron_1.ipcMain.on('isDLCInstalled', (event, dlcAppId) => {
    if (!exports.client) {
        event.returnValue = false;
        return;
    }
    event.returnValue = exports.client.apps.isSubscribedApp(dlcAppId);
});
sendLogToRenderer('info', 'Enabling Steam overlay...');
sw.electronEnableSteamOverlay();
