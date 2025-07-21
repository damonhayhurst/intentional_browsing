function captureScreenshot(): void {
    browser.tabs.captureVisibleTab(null, { format: "png" })
        .then((imageUri: string) => {
            console.log("Captured screenshot as a base64 data URL:");
            console.log(imageUri);
        })
        .catch((error: Error) => {
            console.error("Error capturing screenshot: ", error);
        });
}