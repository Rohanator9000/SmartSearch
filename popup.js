$(function(){
    var gQuery = null;
	
	chrome.storage.sync.get("remember", function(obj) {
		if(obj.remember) {
			var lastSearch;
			chrome.storage.sync.get("lastSearch", function(obj) {
				lastSearch = obj.lastSearch;
				if(lastSearch != null) {
					$("#searchText").val(lastSearch);
				}
				$("#searchText").select();
			});
		}
	});
	
    function sendMessageToTab(msg) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, msg);
        });
    }
    
    function doQuery(userText) {
        gQuery = userText;
        sendMessageToTab({action: "setquery", data: userText});
    }
    
    function next() {
        var userText = $("#searchText").val();
        if(userText == "") {
            sendMessageToTab({action: "clear"});
            gQuery = null;
        } else if(userText != gQuery) {
            doQuery(userText);
        } else {
            sendMessageToTab({action: "next"});
        }
    }
    
    function previous() {
        var userText = $("#searchText").val();
        if(userText == "") {
            sendMessageToTab({action: "clear"});
            gQuery = null;
        } else if (userText != gQuery) {
            doQuery(userText);
        } else {
            sendMessageToTab({action: "previous"});
        }
    }
	
	function reset() {
		sendMessageToTab({action: "reset"});
	}
	
	function changeSynonyms(to) {
		$("#synonyms").text(to);
	}
	
	function updateNum(which, to) {
		switch(which) {
			case 1:
				$("#firstNum").text(to + 1);
				break;
			case 2:
				$("#secNum").text(to);
				break;
			case 3:
				$("#wordNum").text(to);
		}
	}
	
	function makeRed(todo) {
		if(todo) {
			$("#searchText").css("border-color", "red");
		} else {
			$("#searchText").css("border-color", "");
		}
	}
	
	$("#next").click(next);
    $("#previous").click(previous);
    $("#counter").click(reset);
    
    $(document).on("keydown", function(e) {
		//enter
        if (e.keyCode == 13) {
            next();
        }
    });
	
	var port = chrome.extension.connect({name: "Background Close to Unmark"});
	
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		switch(request.action) {
			case "updateFirst":
				updateNum(1, request.data);
				break;
			case "updateSecond":
				updateNum(2, request.data);
				break;
			case "updateSynNum":
				updateNum(3, request.data);
				break;
			case "updateSynonyms":
				changeSynonyms(request.data);
				break;
			case "makeRed":
				makeRed(request.data);
		}
	});
});