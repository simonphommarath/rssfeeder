const path = require('path');
const {app, BrowserWindow} = require('electron');

let mainWindow = null;

function initialize () {

    function createWindow () {

        const windowOptions = {
            width: 1080,
            minWidth: 680,
            height: 840,
            title: app.getName()
        }

        mainWindow = new BrowserWindow(windowOptions);
        mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));
        mainWindow.on('closed', () => {
            mainWindow = null;
        })
    }

    app.on('ready', () => {
        createWindow();
    })

    app.on('window-all-closed', () => {
        app.quit();
    })

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    })
}

initialize();