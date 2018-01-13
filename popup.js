$(function(){
    //global variable for tracking current query
    var gQuery = null;

    //if user selects "remember last search" option, set the current search to the last search
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

    //sends a message to the current tab
    function sendMessageToTab(msg) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, msg);
        });
    }

    //starts a query
    function doQuery(userText) {
        gQuery = userText;
        sendMessageToTab({action: "setquery", data: userText});
    }

    //goes to the next word in the list, or clears everything if field is empty
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

    //goes to the previous word in the list, or clears everything if field is empty
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

    //sends message to reset everything
	function reset() {
		sendMessageToTab({action: "reset"});
	}

    //updates synonyms section
	function changeSynonyms(to) {
		$("#synonyms").text(to);
	}

    //updates the different numbers on the popup
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

    //toggles whether the search box is red
	function makeRed(todo) {
		if(todo) {
			$("#searchText").css("border-color", "red");
		} else {
			$("#searchText").css("border-color", "");
		}
	}

    //links three of the buttons to their respective functions
	$("#next").click(next);
    $("#previous").click(previous);
    $("#counter").click(reset);

    //links enter key to next function
    $(document).on("keydown", function(e) {
		//enter
        if (e.keyCode == 13) {
            next();
        }
    });

    //establishes connection to searchScript
	var port = chrome.extension.connect({name: "Background Close to Unmark"});

    //listens to messages from searchScript.js and triggers respective methods
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
