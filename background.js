chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "runScript") {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            let tab = tabs[0]; // Safe to assume there will only be one result
            // skip urls like "chrome://" to avoid extension error
            if (tab.url?.startsWith("chrome://")) return undefined;
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: attemptTheRoster,
                args: [tab.url]
            }).catch(error => {
                console.error('Error executing script:', error);
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
        var classItem = document.getElementById("crn-description");
        var className = "";

        if (classItem != null) {
            // the `crn-description` gives us a string like: "CRN 22309 Press enter key to view additional class details for Calculus I subject MATH, course 242 for term 202320 and course reference number 22309"
            var crn = classItem.innerText.match(/CRN \d+/)[0]; // Matches "CRN " followed by one or more digits
            var course = classItem.innerText.match(/for (.*?) subject/)[1]; // Matches any characters between "for " and " subject"
            className = `${crn} - ${course}`;  // Outputs: "CRN 22309 - Calculus I"
        }  

        // Now we update the extension popup to let the user know what's happening.
        chrome.runtime.sendMessage({err: "Printing", text: "... attempting to print " + className + ".  Please wait 3 seconds while we try to load all the photos...\n\nUse your browser's print function to print your list."});

        // Find the enrollment count 
        // yes, they misspelled enrolment...
        var enrollments = document.querySelector('.enrollmentInfo[xe-field="courseEnrolmentCount"]');
        var enrollmentCount = 0
        if (enrollments != null){
            enrollmentCount = enrollments.innerText;

            if (enrollmentCount > 100){
                chrome.runtime.sendMessage({err: "LotsOfStudents", text: "We can only print 100 students at a time. After the first 100 print, scroll to the bottom of the site to select the next page and click the button again. Repeat until they're all done. \n \n Please wait ~ 3 seconds for pictures to load."});
            }
        }

        // By default, Banner class list only shows a few images; we have to 
        // scroll to load the whole roster
        // Scroll to the bottom of the page
        var selectElement = document.querySelector('.per-page-select');
        selectElement.value = 'number:100';
        selectElement.dispatchEvent(new Event("change"));

        // This runs a delay, hoping that Banner gets the pictures ready in time.
        setTimeout(function () {
            // Get all images on the webpage
            var images = document.querySelectorAll('img');

            // Make the visual student roster table
            var table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderSpacing = 
            '25px';
            // Add a style element to the document to add padding to the table cells
            var style = document.createElement('style');
            style.textContent = 'table tr td { padding: 25px 0; }'; // 10px top and bottom padding
            document.head.appendChild(style);

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
                
                // Banner added a junk entry that is a blank <img> block that we need to exclude; it has only alt text of "Student Profile Picture"
                if (images[i].alt.includes("Student Profile Picture")) {
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
            table.appendChild(row);

            // Create a new window or tab
            var printWindow = window.open('', '_blank');

            // Write the table into the new window or tab
            printWindow.document.write('<html><head><title>Print Visual Student Roster</title></head><body>');
            
            // adjust print margins via CSS;
            var style = printWindow.document.createElement("style");
            style.textContent = '@media print { body { margin: 0.1in; } }';
            printWindow.document.head.appendChild(style);

            printWindow.document.write("<h1> Visual Student Roster for " + className + "</h1>")
            printWindow.document.write(table.outerHTML);
            printWindow.document.write('</body></html>');

            // Close the document to finish loading the page
            printWindow.document.close();
        }, 3000);
    } else {
        chrome.runtime.sendMessage({err: "WrongBanner", text: "You're not on the Summary Class List. Click the course number on the left, e.g. \"Math 242,0\""});
    }

    return true;
}
