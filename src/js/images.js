function captureScreenshot() {
    browser.tabs.captureVisibleTab(null, { format: "png" })
        .then((imageUri) => {
            console.log("Captured screenshot as a base64 data URL:");
            console.log(imageUri); // This will output the base64 data URL of the screenshot
            // You can save it or display it as needed
        })
        .catch((error) => {
            console.error("Error capturing screenshot: ", error);
        });
}
