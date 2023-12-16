// In your popup.js linked to popup.html
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("clickHerePicture").style.display = "none";
    document.getElementById("clickHere").style.display = "block";

    chrome.runtime.sendMessage({ command: "runScript" }
    );
});

// Handle warning messages to tell how to load the popup.
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        document.getElementById("notice").innerText = request.text;

        if (request.err == "WrongBanner") {
            document.getElementById("clickHerePicture").style.display = "block";
            document.getElementById("clickHere").style.display = "none";
        } else if (request.err == "WrongSite") {
            document.getElementById("clickHerePicture").style.display = "none";
            document.getElementById("clickHere").style.display = "block"; 
        } else if (request.err == "LotsOfStudents") {
            document.getElementById("clickHerePicture").style.display = "none";
            document.getElementById("clickHere").style.display = "none"; 
        } else if (request.err == "Printing") {
            document.getElementById("clickHerePicture").style.display = "none";
            document.getElementById("clickHere").style.display = "none"; 
        }
    });

// Link handler -- facilitates clicking the "click here" div 
// ... it can't be a standard <a> because we need the handler
// to open a new tab.
document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('clickHere');
    link.addEventListener('click', function () {
        chrome.tabs.create({url: 'https://ssbprod.wichita.edu/StudentSelfService/ssb/classListApp/classListPage'});
    });
});