function createArticleNode(type=[], talks) {
    type = Array.isArray(type) ? type : [type];
    type = [...type]
    const article = document.createElement("article");
    article.classList.add('events__event');

    for (let i = 0; i < type.length; i++) {
        article.classList.add('events__event--' + type[i]);
    }

    if (talks.length > 1) {
        article.classList.add("events__event--multiple");
    }

    return article
}

function createDateNode(date) {
    const dateNode = document.createElement("div");
    dateNode.classList.add("events__event-date");
    dateNode.textContent = date;

    return dateNode
}

function createTalksTitleNode (title) {
    const titleNode = document.createElement("h3");
    titleNode.classList.add("events__event-title");
    titleNode.textContent = title;

    return titleNode
}

function createTalksSpeakerNode (speakers) {
    speakers = Array.isArray(speakers) ? speakers : [speakers];
    const speakerNode = document.createElement("span");
    speakerNode.classList.add("events__event-author");
    speakerNode.textContent = "by "

    for (let i = 0; i < speakers.length; i++) {
        const speaker = speakers[i];
        const regex = new RegExp(/(.*)\[(.*)\]/);
        const isLinkable = regex.exec(speaker);

        if (isLinkable) {
            const speakerLink = document.createElement("a");
            speakerLink.textContent = isLinkable[1] + " ";
            speakerLink.href = isLinkable[2];

            speakerNode.appendChild(speakerLink)
        } else {
            const speakerSpan = document.createElement("span");
            speakerSpan.textContent = speaker + " ";

            speakerNode.appendChild(speakerSpan)
        }
    }

    return speakerNode
}

function createTalksNodes(talks) {
    const talksWrapper = document.createElement("div");
    talksWrapper.classList.add("events__content")

    for (let i = 0; i < talks.length; i++) {
        const talkContent = document.createElement("div");
        talkContent.classList.add("events__content__talk");

        const titleNode = createTalksTitleNode(talks[i].title);
        const speakerNode = createTalksSpeakerNode(talks[i].speakers);
        talkContent.appendChild(titleNode);
        talkContent.appendChild(speakerNode);

        talksWrapper.appendChild(talkContent)
    }

    return talksWrapper
}

require(["./eventsData"], function(events){
    const eventsWrapper = document.querySelector('.events__grid');

    for (let i = 0; i < events.length; i++) {
        const article = createArticleNode(events[i].type, events[i].talks);
        const date = createDateNode(events[i].date);
        const talks = createTalksNodes(events[i].talks, events[i].type);

        article.appendChild(date);
        article.appendChild(talks);
        
        eventsWrapper.appendChild(article);
    }
    console.log(eventsWrapper)
})