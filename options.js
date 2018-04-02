function saveOptions() {
	var remember = $("#yesPrev").is("input:checked") ? true : false;
	var remove = $("#yesRemove").is("input:checked") ? true : false;
	var partial = $("#yesPartial").is("input:checked") ? true : false;
	var partialSyns = $("#yesPartialSyns").is("input:checked") ? true : false;

	chrome.storage.sync.set({
		"remember" : remember,
		"remove" : remove,
		"partial" : partial,
		"partialSyns": partialSyns
	});
}

function restoreOptions() {
	chrome.storage.sync.get({
		"remember": true,
		"remove": true,
		"partial": true,
		"partialSyns": false
	}, function(options) {
		$("#yesPrev").prop("checked", options.remember);
		$("#yesRemove").prop("checked", options.remove);
		$("#yesPartial").prop("checked", options.partial);
		$("#yesPartialSyns").prop("checked", options.partialSyns);
	});
}

$("#save").click(saveOptions);

$(function() {
	restoreOptions();
});
