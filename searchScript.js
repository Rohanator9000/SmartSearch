var doms = new Array();
var options = {
    "each": function(result) {
        if($(result).is(':visible')) {
            doms.push(result);
			var word = $(result).text().toLowerCase();
			if ($.inArray(word, pageSyns) == -1) {
				pageSyns.push(word);
				pageSynsNum++;
			}
        }
    },
    "separateWordSearch": false
};
var currentIndex = 0;
var numDoms = 0;
var pageSynsNum=0;
var pageSyns = [];

//PRELOAD FILE TO REDUCE LAG TIME
var splitData = readDatabase();

//QUERY SET

function handleSetQuery(findWord) {
	
	//STORE FOR FUTURE INSERTION
	chrome.storage.sync.set({"lastSearch": findWord});
	
	//CHECK TO SEE IF PARTIAL
	chrome.storage.sync.get("partial", function(obj) {
		
		if (obj.partial) {
			options.accuracy = "partially";
		} else {
			options.accuracy = "exactly";
		}
		
		handleClear();
		$("body").mark(findWord, options);
		
		chrome.storage.sync.get("partialSyns", function(obj2) {
			
			if (obj2.partialSyns) {
				options.accuracy = "partially";
			} else {
				options.accuracy = "exactly";
			}
			
			//GET + HIGHLIGHT SYNONYMS
			var synonyms = getSynonyms(findWord);			
			synonyms.forEach(function(element, index, array) {
				$("body").mark(element, options);
			});
			
			
			numDoms = doms.length;			
			if (numDoms > 0) {				
				chrome.runtime.sendMessage({action: "makeRed", data: false});
				sortDoms(0, numDoms - 1);
				getToFirstDom();
				chrome.runtime.sendMessage({action: "updateSecond", data: numDoms});
				
				//UPDATE SYNONYMS
				updateSynonyms(findWord);
				chrome.runtime.sendMessage({action: "updateSynNum", data: pageSynsNum});
			} else {
				chrome.runtime.sendMessage({action: "makeRed", data: true});
			}
		});
	});
}

function getToFirstDom() {
	while(currentIndex < doms.length && !isVisible(doms[currentIndex])) {
		currentIndex++;
	}
	
	currentIndex = currentIndex == doms.length ? 0 : currentIndex;
	
	doms[currentIndex].scrollIntoViewIfNeeded();
	$(doms[currentIndex]).addClass("highlightSelected");
	chrome.runtime.sendMessage({action: "updateFirst", data: currentIndex});
}

function isVisible(el) {
	var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
	
    var elTop = $(el).offset().top;
    var elBottom = elTop + $(el).height();

    return (elBottom <= docViewBottom) && (elTop >= docViewTop);
}

function updateSynonyms(findWord) {
	pageSyns = $.grep(pageSyns, function(element, index) {
		return element != findWord;
	});
	pageSynsNum--;
	var synsOut = "";
	pageSyns.forEach(function(element, index, array) {
		synsOut += element + ", ";
	});
	synsOut = synsOut.slice(0, synsOut.length-2);
	synsOut = synsOut == "" ? "no synonyms :(" : synsOut;
	chrome.runtime.sendMessage({action: "updateSynonyms", data: synsOut});
}

function getSynonyms(findWord) {
	var synonymArray =[];
	var index = 1;
	
	while(index < splitData.length) {
		var wordGroup = splitData[index];
		var words = wordGroup.split("|");
		var numDefs = parseInt(words[1]);
		if(words[0] == findWord) {
			var defBegin = index + 1;
			var defEnd = index + numDefs;
			for(var defParse = defBegin; defParse < defEnd; defParse++) {
				var synWords = splitData[defParse].split("|");
				for(var synParse = 1; synParse < synWords.length; synParse++) {
					synonymArray.push(synWords[synParse]);
				}
			}
			break;
		} else {
			index += 1 + numDefs;
		}
	}
	
	return synonymArray;
}

function readDatabase() {
	var request = new XMLHttpRequest();
	var file = chrome.extension.getURL("database.txt");
	request.open("GET", file, false);
	request.send();
	var splitData = request.responseText.split("\n");
	return splitData;
}

//DOM SORTING

function sortDoms(start,  end) {
    if(start < end) {
        var partitionIndex = partitionDoms(start, end);
        sortDoms(start, partitionIndex - 1);
        sortDoms(partitionIndex + 1, end);
    }
}

function partitionDoms(start, end) {
    var pivotIndex = end;
    var partitionIndex = start;
    var i;
    for (i = start; i < end; i++) {
        if (!domIsBefore(doms[i], doms[pivotIndex])) {
            domSwapElements(i, partitionIndex);
            partitionIndex++;
        }
    }
    domSwapElements(partitionIndex, end);
    return partitionIndex;
}

function domIsBefore(el1, el2) {
    if (el1.compareDocumentPosition(el2) == 2) {
        return true;
    } else if (el1.compareDocumentPosition(el2) == 4) {
        return false;
    }
}

function domSwapElements(first, second) {
    var temp = doms[first];
    doms[first] = doms[second];
    doms[second] = temp;
}

//WORD CYCLING

function handleClear() {
	//RESET QUERY
	$("body").unmark();
    doms = new Array();
    currentIndex = 0;
    numDoms = 0;
	
	//RESET COUNTER
	chrome.runtime.sendMessage({action: "updateFirst", data: -1});
	chrome.runtime.sendMessage({action: "updateSecond", data: 0});
	
	//RESET SYNONYMS
	pageSynsNum = 0;
	pageSyns = [];
	chrome.runtime.sendMessage({action: "updateSynonyms", data: "no synonyms :("});
	chrome.runtime.sendMessage({action: "updateSynNum", data: 0});
}

function handlePrevious() {
	if (numDoms > 0) {
		$(doms[currentIndex]).removeClass("highlightSelected");
		currentIndex = currentIndex - 1 > -1 ? currentIndex - 1 : numDoms - 1;
		doms[currentIndex].scrollIntoViewIfNeeded();
		$(doms[currentIndex]).addClass("highlightSelected");
		chrome.runtime.sendMessage({action: "updateFirst", data: currentIndex});
	}
}

function handleNext() {
	if (numDoms > 0) {
		$(doms[currentIndex]).removeClass("highlightSelected");
		currentIndex = (currentIndex + 1) % numDoms;
		doms[currentIndex].scrollIntoViewIfNeeded();
		$(doms[currentIndex]).addClass("highlightSelected");
		chrome.runtime.sendMessage({action: "updateFirst", data: currentIndex});
	}
}

function handleReset() {
	if (numDoms > 0) {
		$(doms[currentIndex]).removeClass("highlightSelected");
		currentIndex = 0;
		doms[0].scrollIntoViewIfNeeded();
		$(doms[0]).addClass("highlightSelected");
		chrome.runtime.sendMessage({action: "updateFirst", data: 0});
	}
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch(request.action) {
		case "setquery":
			handleSetQuery(request.data);
			break;
		case "previous":
			handlePrevious();
			break;
		case "next":
			handleNext();
			break;
		case "reset":
			handleReset();
			break;
		case "clear":
			handleClear();
	}
});