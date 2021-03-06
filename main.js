const electron = require('electron');
//const url = require('url');
const path = require('path');
const Parser = require('rss-parser');
const fs = require('fs');
const readline = require('readline');

const {app, BrowserWindow, Menu, MenuItem, ipcMain} = electron;

mainWindow = null;
addFeedWindow = null;
const file = 'link.txt';
var feeds = [];

// Add feed menu
function createAddFeed() {

    const windowOptions = {
        width: 300,
        height: 125,
        title: 'Add Feed',
        resizable: false
    };

    addFeedWindow = new BrowserWindow(windowOptions);

    addFeedWindow.loadURL(path.join('file://', __dirname, '/addWindow.html'));

    // Garbage collection
    addFeedWindow.on('closed', () => {
        addFeedWindow = null;
    });   
}

function refreshFeed() {

    readFile();

    mainWindow.webContents.send('item:clean');

    feeds.sort(function(a,b){
        return new Date(b.pubDate) - new Date(a.pubDate);
    });

    feeds.forEach(item => {
        mainWindow.webContents.send('item:refresh', item);
    });
}

function GetFeed(link) {
    let parser = new Parser();

    (async () => {
        let feed = await parser.parseURL(link);   
        feed.items.forEach(item => {
          //console.log(item.author + ' : ' + item.title + ' : ' + item.pubDate);
          var date = new Date(item.pubDate);
          item.pubDate = date.toLocaleString();
          feeds.push(item);
        });
    })(); 
}

function readFile() {
    var feeds = [];
    fs.access('link.txt', fs.constants.F_OK, (err) => {

        if(err) {
            console.log('Files does not exist, creating new file...');

            fs.writeFile('link.txt', '', (err) => {
                if (err) throw err;
                console.log("The file was succesfully saved!");
            }); 
            
        } else {
            const rl = readline.createInterface({
                input: fs.createReadStream(file)
            });
        
            rl.on('line', function (line) {
                GetFeed(line);
            });
        }
    });
}

function initialize () {

    readFile();

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
                    label:'Refresh feed',
                    click() {
                        refreshFeed()
                    }
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
            height: 840,
            title: app.getName(),
            resizable: false
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

// Save feed link into file
ipcMain.on('item:add', function(e, feedItem){
    // add check if link is valid
    fs.appendFile('link.txt', '\n'+feedItem, function (err) {
        if (err) throw err;
    });
    addFeedWindow.close();
});

initialize();