button = document.getElementById('myButton')

if (button != null){
    document.getElementById('myButton').addEventListener('click', function () {
        // Send a message to the background script
        chrome.runtime.sendMessage({ command: "runScript" });
    });
}