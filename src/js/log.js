export function backgroundLog(message) {
    browser.runtime.sendMessage({ log: message })
} 
