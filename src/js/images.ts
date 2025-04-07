import browser from 'webextension-polyfill';

export function captureScreenshot(): Promise<string> {
    return browser.tabs.captureVisibleTab(undefined, { format: "png" })
        .then((imageUri: string) => {
            console.log("Captured screenshot as a base64 data URL:");
            console.log(imageUri);
            return imageUri;
        })
        .catch((error: Error) => {
            console.error("Error capturing screenshot: ", error);
            throw error;
        });
}
