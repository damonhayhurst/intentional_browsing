export function backgroundLog(message) {
    const currentDate = new Date();
    const currentTime = currentDate.toISOString() + " ";
    browser.runtime.sendMessage({ log: currentTime + message })
} 
