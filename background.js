var xmlText;
var xmlName;

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
		if(request.type == "read"){
			response = "here be XML:" + xmlText;
			sendResponse({name: xmlName, text: xmlText});
		}
		else{
			console.log("received XML text: \n"+request.text);
			xmlName = request.name;
			xmlText = request.text;
			
			console.log("\n\n\n\n\n");
			console.log("written XML text: \n"+xmlText);
			//sendResponse({answer: "successfully w"});
		}
	}
);