chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "runScript") {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            let tab = tabs[0]; // Safe to assume there will only be one result
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: attemptTheRoster,
                args: [tab.url]
            });
        });
    }
});

function attemptTheRoster(url) {

    // Update this code so it will only run on Banner and will error otherwise!
    if (! url.includes("ssbprod.wichita.edu")) {
        chrome.runtime.sendMessage({err: "WrongSite", text: "This only runs on WSU's Banner Class List. \n\n Head to MyWSU Teach/Advise and select Banner 9 Self-Service"});
        return;
    }

    // Only run if we're on the Summary Class List
    var classListDiv = document.querySelector("#gridCaption")
    if (classListDiv.innerText == "Summary Class List") {

        // What is the class name? It's hidden in a span.
        var classItem = document.querySelector(".select2-chosen")
        var className = ""
        if (classItem != null) {
            className = classItem.innerText;
        }

        // Get all images on the webpage
        var images = document.querySelectorAll('img');

        // Make the visual student roster table
        var table = document.createElement('table');

        // Each row will have only so many to fit on a page
        var MAX_PHOTOS = 4
        var tdCounter = 0;
        var row;
        for (var i = 0; i < images.length; i++) {
            // There are "garbage" entries from banner
            // they include the "CONFIDENTIAL" and "DECEASED" indicators
            if (!images[i].src.includes("classListPicture")) {
                continue;
            }

            // Create a new row and cells
            if (tdCounter == 0) {
                row = document.createElement('tr');
            }
            var cell = document.createElement('td');
            cell.style.textAlign = 'center';
            cell.style.verticalAlign = 'middle';

            // Insert the image component
            var img = document.createElement('img');
            img.src = images[i].src;
            img.width = 250;
            img.alt = images[i].alt;
            cell.appendChild(img);

            // Then add teh text below it
            var name = document.createElement('div')
            name.innerHTML = '<span style="font-size: 20px;">' + images[i].alt + '</span>';
            cell.appendChild(name);


            // Finally, put it into the row.
            row.appendChild(cell);

            // Add the row to the table
            tdCounter++;
            if (tdCounter == MAX_PHOTOS) {
                table.appendChild(row);
                tdCounter = 0;
            }
        }

        // Create a new window or tab
        var printWindow = window.open('', '_blank');

        // Write the table into the new window or tab
        printWindow.document.write('<html><head><title>Print Visual Student Roster</title></head><body>');
        printWindow.document.write("<h1> Visual Student Roster for " + className + "</h1>")
        printWindow.document.write(table.outerHTML);
        printWindow.document.write('</body></html>');

        // Close the document to finish loading the page
        printWindow.document.close();

        // Call the print function
        printWindow.print();
    } else {
        chrome.runtime.sendMessage({err: "WrongBanner", text: "You're not on the Summary Class List. Click the course number on the left, e.g. \"Math 242,0\""});
    }

    return true;
}
