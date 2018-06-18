const path = require('path');
const {app, BrowserWindow, Menu, MenuItem, ipcMain} = require('electron');

function initialize () {

	function createContextMenu() {

		const menu = new Menu();

		menu.append(new MenuItem({ label: 'Refresh' }));

		app.on('browser-window-created', (event, win) => {
			win.webContents.on('context-menu', (e, params) => {
				menu.popup(win, params.x, params.y)
			})
		});

		ipcMain.on('show-context-menu', (event) => {
			const win = BrowserWindow.fromWebContents(event.sender)
			menu.popup(win)
		});
	}

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
		createContextMenu();
        createWindow();
    })

    app.on('window-all-closed', () => {
        app.quit();
    })

    app.on('activate', () => {
        if (mainWindow === null) {
			createContextMenu();
            createWindow();
        }
    })
}

initialize();