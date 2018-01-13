chrome.extension.onConnect.addListener(function(port) {
	port.onDisconnect.addListener(function() {
		chrome.storage.sync.get("remove", function(obj) {
			if(obj.remove) {
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					chrome.tabs.sendMessage(tabs[0].id, {action: "clear"});
				});
			}
		});
	});
});