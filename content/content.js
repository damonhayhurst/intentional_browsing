function parseContent() {
  var content = document.body.innerHTML;
  content = cleanHTML(content);
  return content.innerText;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.parse) {
    content = parseContent();
	browser.runtime.sendMessage({content: content})
	.then(reply => console.log(reply))
	.catch((error) => console.error('Error:', error));
	return true;
  }
  if (message.reply) {
	console.log(message.reply);
  }
})
