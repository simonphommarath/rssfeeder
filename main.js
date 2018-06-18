const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu, MenuItem, ipcMain} = electron;

mainWindow = null;
addFeedWindow = null;

// Add feed menu
function createAddFeed() {

    const windowOptions = {
        width: 300,
        height: 200,
        title: 'Add Feed'
    };

    addFeedWindow = new BrowserWindow(windowOptions);

    addFeedWindow.loadURL(path.join('file://', __dirname, '/addWindow.html'));

    // Garbage collection
    addFeedWindow.on('closed', () => {
        addFeedWindow = null;
    });   
}

function initialize () {

    // Create right-click menu
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
    
    // Create top menu
    function createMainMenu() {

        const mainMenu = [{
            label:'File',
            submenu: [
                {
                    label:'Add feed',
                    click() {
                        createAddFeed()
                    }
                },
                {
                    label:'Clear feed',
                    click() {
                        mainWindow.webContents.send('item:clear');
                    }
                },
                {
                    label:'Refresh feed'
                },
                {
                    label:'Quit (ctrl + q)',
                    // Check which platform is the app on (darwin = mac)
                    accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click() {
                        app.quit();
                    }
                }
            ]
        }];

        // If mac, add empty object to the menu
        if(process.platform == 'darwin'){
            mainMenu.unshift({});
        }

        // If in dev mode
        if(process.env.NODE_ENV !== 'production') {
            mainMenu.push({
                label: 'DevTools',
                submenu: [{
                    label: 'Toggle DevTools',
                    accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }]
            });
        }

        const menu = Menu.buildFromTemplate(mainMenu);
        Menu.setApplicationMenu(menu);
    }

    // Create main window
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
            app.quit();
        })
	};
    
    // When the app is ready
    app.on('ready', () => {
        createMainMenu();
        createContextMenu();
        createWindow();
    });

    app.on('window-all-closed', () => {
        app.quit();
    });

    app.on('activate', () => {
        if (mainWindow === null) {
			createContextMenu();
            createWindow();
        }
    });
}

    // Add feed item
    ipcMain.on('item:add', function(e, feedItem){
        mainWindow.webContents.send('item:add', feedItem);
        console.log(feedItem);
        addFeedWindow.close();
    });

initialize();
