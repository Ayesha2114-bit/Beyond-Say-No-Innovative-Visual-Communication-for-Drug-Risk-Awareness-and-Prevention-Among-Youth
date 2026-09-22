/* ============================================================
   BEYOND SAY NO
   Interactive Drug-Risk Awareness Intervention
   Data-driven vanilla JavaScript
   ============================================================ */

const CONFIG = {
    postTestUrl: "https://forms.gle/DSPjpxLNj4CAroTG9",
    resources: {
        helpline: {
            name: "National Drug De-Addiction Helpline",
            number: "14446",
            description: "Support and referral related to substance-use concerns."
        },
        mentalHealth: {
            name: "Tele-MANAS",
            number: "14416",
            alternative: "1800-89-14416",
            description: "National tele-mental-health support service."
        }
    }
};

const INITIAL_ANSWERS = {
    scenario1: null,
    redFlags: [],
    myth1: null,
    myth2: null,
    myth3: null,
    peerPressure: null,
    misinformation: null,
    someoneNeedsHelp: null,
    helpingFriend: null,
    helpSeeking: null,
    finalScenario: null
};

const state = {
    currentScreen: "home",
    interventionStep: 0,
    totalSteps: 9,
    answers: createInitialAnswers(),
    mythIndex: 0
};

const mythQuestions = [
    {
        claim: "If someone only uses occasionally, there is no risk.",
        correct: "myth",
        explanation: "Frequency alone does not determine whether something is risky. Risk can depend on the substance, circumstances, pattern of use, amount, and the person."
    },
    {
        claim: "If everyone around you is doing it, it must be safe.",
        correct: "myth",
        explanation: "Popularity is not evidence of safety. A behaviour can become normalized within a group without becoming safe."
    },
    {
        claim: "Using a substance to deal with stress can become a risky coping pattern.",
        correct: "fact",
        explanation: "Using substances as a way to cope with stress can create additional risks and may make it harder to address the underlying problem."
    }
];

const dom = {};

function createInitialAnswers() {
    return { ...INITIAL_ANSWERS, redFlags: [] };
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function toDatasetKey(attribute) {
    return attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function createButton(text, action, type = "primary", extraClass = "") {
    return `<button type="button" class="button button-${escapeHTML(type)} ${escapeHTML(extraClass)}" data-action="${escapeHTML(action)}">${escapeHTML(text)}</button>`;
}

function screenWrapper(content) {
    return `<section class="screen" aria-label="Beyond Say No screen" tabindex="-1">${content}</section>`;
}

function chatBubble(speaker, message, right = false) {
    return `<div class="chat-bubble ${right ? "right" : ""}"><span class="chat-name">${escapeHTML(speaker)}</span>${escapeHTML(message)}</div>`;
}

function characterGroup() {
    const character = (role, label) => `
        <div class="character character-${escapeHTML(role)}" aria-hidden="true">
            <div class="character-head"></div>
            <div class="character-eye left"></div>
            <div class="character-eye right"></div>
            <div class="character-body"></div>
            ${role !== "helper" ? '<div class="character-phone"></div>' : ""}
            <span class="character-label">${escapeHTML(label)}</span>
        </div>`;

    return `<div class="character-group">${character("peer", "pressure")}${character("person", "you")}${character("helper", "support")}</div>`;
}

function characterStage(speech) {
    return `<div class="character-stage">${characterGroup()}${speech ? `<div class="chat-bubble right stage-speech"><span class="chat-name">Pause</span>${escapeHTML(speech)}</div>` : ""}</div>`;
}

function updateProgress(step) {
    state.interventionStep = step;
    const visible = step > 0 && step <= state.totalSteps;
    if (dom.progressContainer) dom.progressContainer.hidden = !visible;
    if (dom.headerHomeButton) dom.headerHomeButton.hidden = !visible;
    if (!visible) return;

    dom.progressLabel.textContent = `${String(step).padStart(2, "0")} / ${String(state.totalSteps).padStart(2, "0")}`;
    dom.progressBar.style.width = `${step / state.totalSteps * 100}%`;
    dom.progressBar.setAttribute("aria-valuenow", String(step));
}

function focusScreen() {
    window.setTimeout(() => {
        const screen = dom.container.querySelector(".screen");
        const heading = screen?.querySelector("h1, h2");
        (heading || screen || dom.container)?.focus({ preventScroll: true });
    }, 50);
}

function renderScreen(name, html, progress = 0) {
    state.currentScreen = name;
    dom.container.innerHTML = html;
    updateProgress(progress);
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusScreen();
}

function renderChoiceButtons(items, attribute) {
    return items.map(({ value, label }) => `
        <button type="button" class="choice-button" data-${attribute}="${escapeHTML(value)}" aria-pressed="false">
            ${escapeHTML(label)}
        </button>`).join("");
}

function selectSingleChoice(button, selector, answerKey, value) {
    state.answers[answerKey] = value;
    document.querySelectorAll(selector).forEach(item => {
        const selected = item === button;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-pressed", String(selected));
    });
}

function insertFeedback(elementId, title, message, nextAction, nextText = "NEXT →") {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.innerHTML = `
        <div class="feedback" role="status">
            <div class="feedback-title">${escapeHTML(title)}</div>
            <p>${escapeHTML(message)}</p>
        </div>
        <div class="actions">${createButton(nextText, nextAction)}</div>`;
}

function showHome() {
    resetJourney();
    renderScreen("home", screenWrapper(`
        <div class="hero">
            <div class="hero-copy">
                <span class="eyebrow">Interactive visual intervention</span>
                <h1>BEYOND<br>SAY NO</h1>
                <p class="lead">Sometimes the risk isn't obvious.</p>
                <p class="muted hero-description">Learn to spot risky situations, question misinformation, respond to pressure, and know what to do next.</p>
                <div class="actions hero-actions">
                    ${createButton("EXPLORE THE CHALLENGE →", "scenario1")}
                    ${createButton("I NEED SUPPORT →", "support", "secondary")}
                    ${createButton("I'M WORRIED ABOUT SOMEONE →", "worried", "secondary")}
                </div>
            </div>
            <div class="hero-visual">${characterGroup()}
                <div class="chat-bubble right hero-speech"><span class="chat-name">Pause</span>What do you notice when the risk isn't obvious?</div>
            </div>
        </div>`));
}

const choiceScreens = {
    scenario1: {
        step: 1, eyebrow: "01 • First scene", title: "Something feels off.",
        lead: "Read the conversation. Then look for what deserves your attention.",
        answerKey: "scenario1", attribute: "choice", prompt: "What do you notice?",
        instruction: "Choose the response that best identifies the situation.",
        bubbles: [["A", "I've been really stressed lately."], ["B", "There's something that helps. Everyone does it.", true], ["A", "I don't know..."]],
        options: [["stress", "Stress is involved."], ["normalization", "Someone is normalizing the behaviour."], ["substance_solution", "A substance is being presented as an easy solution."], ["all", "All of these."]],
        next: "redFlags", feedbackId: "scenario1Feedback", feedbackTitle: "THINK IT THROUGH",
        feedback: value => value === "all" ? "Exactly. Stress, normalization, and presenting substance use as an easy solution can all be warning signs worth paying attention to." : "Good observation. That is one important signal. There are multiple signals in this situation, so look at the whole pattern rather than one statement alone."
    },
    peerPressure: {
        step: 4, eyebrow: "04 • Peer pressure", title: "The group chat.",
        lead: "Pressure can make an ordinary decision feel much harder.", answerKey: "peerPressure", attribute: "peer-choice", prompt: "What could you do?",
        bubbles: [["Friend", "Come on."], ["Friend", "Everyone's doing it.", true], ["Friend", "Don't be boring."]],
        options: [["go_along", "Go along with them."], ["boundary", "Say no and leave the situation."], ["redirect", "Suggest something else or change the situation."], ["stay", "Stay because you don't want to look different."]],
        next: "misinformation", feedbackId: "peerFeedback", feedbackTitle: "PAUSE", speech: "You are allowed to step away.",
        feedback: value => value === "boundary" || value === "redirect" ? "Those are ways to create distance from the pressure without having to prove yourself to the group." : "Pressure can make a risky decision feel normal. You can set a boundary, leave the situation, or redirect what is happening."
    },
    misinformation: {
        step: 5, eyebrow: "05 • Critical thinking", title: "The misinformation trap.",
        lead: "A confident message isn't automatically a reliable one.", answerKey: "misinformation", attribute: "misinfo-choice", prompt: "What should make you question this message?",
        bubbles: [["Group chat", "Bro, this stuff helps you study. Way better than sleep 😂", true]],
        options: [["solution", "It presents a substance as a solution."], ["evidence", "No reliable evidence is provided."], ["confidence", "It uses confidence or popularity instead of evidence."], ["all", "All of these."]],
        next: "someoneNeedsHelp", feedbackId: "misinfoFeedback", feedbackTitle: "QUESTION THE CLAIM",
        feedback: () => "Confidence is not evidence. Personal stories, jokes, social-media claims, and “everyone knows” statements do not prove that something is safe or effective."
    },
    someoneNeedsHelp: {
        step: 6, eyebrow: "06 • Asking for help", title: "Someone wants help.",
        lead: "A person doesn't have to wait until everything gets worse before asking for support.", answerKey: "someoneNeedsHelp", attribute: "help-choice", prompt: "What could happen next?", speech: "Asking for help is a next step.",
        bubbles: [["A", "I think I've started relying on it when I'm stressed."], ["A", "I don't know if it's becoming a problem."], ["A", "I think I might need help."]],
        options: [["alone", "Keep it secret and hope it goes away."], ["trusted", "Talk to someone trustworthy."], ["professional", "Seek professional help."], ["information", "Look for reliable support and information."], ["wait", "Wait until the problem becomes serious."]],
        next: "helpingFriend", feedbackId: "helpFeedback", feedbackTitle: "A NEXT STEP",
        feedback: value => ["trusted", "professional", "information"].includes(value) ? "Asking for help early is a valid option. Trusted people, qualified professionals, and appropriate support services can help with the next step." : "Waiting or handling everything completely alone can make it harder to get support. A person can ask for help before things become more serious."
    },
    helpingFriend: {
        step: 7, eyebrow: "07 • Supporting someone", title: "Your friend tells you.",
        lead: "Supporting someone does not mean having to solve the entire problem yourself.", answerKey: "helpingFriend", attribute: "friend-choice", prompt: "How would you respond?",
        bubbles: [["Friend", "I've been using something when I'm stressed."], ["Friend", "I don't really know how to stop."], ["Friend", "How do I even tell someone?"]],
        options: [["stop", "“Just stop. It's that simple.”"], ["secret", "“Don't tell anyone. I'll keep it secret.”"], ["support", "“I'm glad you told me. Let's find someone who can help.”"], ["dismiss", "“Everyone has problems. You'll be fine.”"]],
        next: "helpSeeking", feedbackId: "friendFeedback", feedbackTitle: "SUPPORT WITHOUT SHAME",
        feedback: value => value === "support" ? "Listening without shaming someone and encouraging appropriate help can make it easier for them to seek support." : value === "secret" ? "You can support someone without promising secrecy when safety may be at risk." : "Dismissive or judgmental responses can make someone less comfortable seeking help. Support starts with listening."
    },
    helpSeeking: {
        step: 8, eyebrow: "08 • Help-seeking", title: "Okay. What happens next?",
        lead: "You don't have to solve everything alone.", answerKey: "helpSeeking", attribute: "seeking-choice", prompt: "Someone is worried about their own substance use. What is a reasonable next step?",
        options: [["alone", "Keep it completely to yourself."], ["social", "Search random social-media advice."], ["professional", "Talk to a trusted person and/or qualified professional."], ["wait", "Wait until the problem becomes serious."]],
        next: "finalChallenge", feedbackId: "seekingFeedback", feedbackTitle: "NEXT STEP",
        feedback: value => value === "professional" ? "A trusted person and/or qualified professional can help someone understand what to do next. You don't have to solve everything alone." : "Reliable support from trusted people or qualified professionals can be a more useful next step than secrecy, random social-media advice, or waiting."
    }
};

function renderChoiceScreen(key) {
    const screen = choiceScreens[key];
    const bubbles = (screen.bubbles || []).map(item => chatBubble(...item)).join("");
    const options = screen.options.map(([value, label]) => ({ value, label }));
    const stage = screen.speech ? `<div class="story-side">${characterStage(screen.speech)}</div>` : "";
    const layout = screen.speech ? "story-layout" : "";

    renderScreen(key, screenWrapper(`
        <span class="eyebrow">${escapeHTML(screen.eyebrow)}</span>
        <h2>${escapeHTML(screen.title)}</h2>
        <p class="lead">${escapeHTML(screen.lead)}</p>
        <div class="${layout}">
            <div class="card ${screen.speech ? "" : "story-main"}">
                ${bubbles ? `<div class="chat">${bubbles}</div>` : ""}
                <h3>${escapeHTML(screen.prompt)}</h3>
                ${screen.instruction ? `<p class="small">${escapeHTML(screen.instruction)}</p>` : ""}
                <div class="choice-list">${renderChoiceButtons(options, screen.attribute)}</div>
                <div id="${screen.feedbackId}" aria-live="polite"></div>
            </div>${stage}
        </div>`), screen.step);
}

function showScenario1() { renderChoiceScreen("scenario1"); }
function showPeerPressure() { renderChoiceScreen("peerPressure"); }
function showMisinformation() { renderChoiceScreen("misinformation"); }
function showSomeoneNeedsHelp() { renderChoiceScreen("someoneNeedsHelp"); }
function showHelpingFriend() { renderChoiceScreen("helpingFriend"); }
function showHelpSeeking() { renderChoiceScreen("helpSeeking"); }

function showRedFlags() {
    state.answers.redFlags = [];
    renderScreen("redFlags", screenWrapper(`
        <span class="eyebrow">02 • Risk recognition</span>
        <h2>Spot the red flags.</h2>
        <p class="lead">Tap the statements that would make you pause. More than one can be relevant.</p>
        <div class="card">
            <div class="chat">${chatBubble("Friend", "I only do it when I'm stressed.")}${chatBubble("Friend", "It's not really dangerous.", true)}${chatBubble("Friend", "Everyone around me does it.")}</div>
            <div class="choice-list">${renderChoiceButtons([
                { value: "1", label: "“I only do it when I'm stressed.”" },
                { value: "2", label: "“It's not really dangerous.”" },
                { value: "3", label: "“Everyone around me does it.”" }
            ], "redflag")}</div>
            <p class="small">Select at least one statement to continue.</p>
            <div id="redFlagFeedback" aria-live="polite"></div>
        </div>`), 2);
}

function showMythCheck() {
    state.mythIndex = 0;
    renderMythQuestion();
}

function renderMythQuestion() {
    const question = mythQuestions[state.mythIndex];
    if (!question) return showPeerPressure();
    renderScreen("mythCheck", screenWrapper(`
        <span class="eyebrow">03 • Misinformation</span>
        <h2>Wait. Is that actually true?</h2>
        <p class="lead">Question confident claims instead of accepting them at face value.</p>
        <div class="card">
            <p class="scenario-number">Claim ${state.mythIndex + 1} of ${mythQuestions.length}</p>
            <h3>${escapeHTML(question.claim)}</h3>
            <div class="choice-list">${renderChoiceButtons([
                { value: "myth", label: "MYTH" },
                { value: "fact", label: "FACT" },
                { value: "unsure", label: "NOT SURE" }
            ], "myth-choice")}</div>
            <div id="mythFeedback" aria-live="polite"></div>
        </div>`), 3);
}

function handleMythChoice(button) {
    const selected = button.dataset.mythChoice;
    const question = mythQuestions[state.mythIndex];
    const answerKey = `myth${state.mythIndex + 1}`;
    selectSingleChoice(button, "[data-myth-choice]", answerKey, selected);
    insertFeedback("mythFeedback", selected === question.correct ? "CORRECT" : "KEEP QUESTIONING", question.explanation, "nextMyth", state.mythIndex < mythQuestions.length - 1 ? "NEXT CLAIM →" : "CONTINUE →");
}

function nextMyth() {
    if (state.mythIndex < mythQuestions.length - 1) {
        state.mythIndex += 1;
        renderMythQuestion();
    } else {
        showPeerPressure();
    }
}

function handleSingleChoice(button, screen) {
    const value = button.dataset[toDatasetKey(screen.attribute)];
    selectSingleChoice(button, `[data-${screen.attribute}]`, screen.answerKey, value);
    insertFeedback(screen.feedbackId, screen.feedbackTitle, screen.feedback(value), screen.next);
}

function handleRedFlagChoice(button) {
    const value = button.dataset.redflag;
    const index = state.answers.redFlags.indexOf(value);
    const selected = index === -1;
    if (selected) state.answers.redFlags.push(value);
    else state.answers.redFlags.splice(index, 1);

    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    if (!state.answers.redFlags.length) {
        document.getElementById("redFlagFeedback").innerHTML = "";
        return;
    }
    insertFeedback("redFlagFeedback", "GOOD OBSERVATION", "Using a substance to cope with stress, minimizing risks, and treating popularity as proof of safety are all reasons to pause and look more closely.", "mythCheck");
}

function resourceCard(resource) {
    const alternative = resource.alternative ? `<p class="small">Alternative: <strong>${escapeHTML(resource.alternative)}</strong></p><a class="call-button" href="tel:${escapeHTML(resource.alternative)}">CALL ALTERNATIVE</a>` : "";
    return `<div class="info-card"><h3>${escapeHTML(resource.name)}</h3><div class="resource-number">${escapeHTML(resource.number)}</div><p class="muted">${escapeHTML(resource.description)}</p>${alternative}<a class="call-button" href="tel:${escapeHTML(resource.number)}">CALL ${escapeHTML(resource.number)}</a></div>`;
}

function supportCards() {
    return resourceCard(CONFIG.resources.helpline) + resourceCard(CONFIG.resources.mentalHealth);
}

function showFinalChallenge() {
    renderScreen("finalChallenge", screenWrapper(`
        <span class="eyebrow">09 • Put it together</span>
        <h2>One last situation.</h2>
        <p class="lead">Apply what you've learned to a new situation.</p>
        <div class="card">
            <p>Your friend has been under heavy stress.</p><p>Someone tells them a substance will help them cope.</p><p>They hear: <strong>“Everyone does it.”</strong></p><p>Later, they privately say they're worried about their use.</p>
            <div class="feedback"><div class="feedback-title">Pause.</div><p>What are the warning signs? What claim should be questioned? What support could help?</p></div>
            <div class="actions">${createButton("I'M READY →", "finalReveal")}</div>
        </div>`), 9);
}

function showFinalReveal() {
    const cards = [
        ["RECOGNIZE", "Notice risky coping, pressure, normalization, and unsupported claims."],
        ["QUESTION", "Popularity and confidence are not evidence of safety."],
        ["SUPPORT", "Listen without shaming and encourage appropriate help."],
        ["SEEK HELP", "Trusted people and qualified professionals can help with the next step."]
    ].map(([title, text]) => `<div class="info-card"><h3>${title}</h3><p class="muted">${text}</p></div>`).join("");
    renderScreen("finalReveal", screenWrapper(`<div class="final-message"><span class="eyebrow">You spotted the signals</span><h2>Recognize → Question → Support.</h2><p class="lead">You don't need to know everything. You need to recognize when something isn't right — and know what to do next.</p></div><div class="info-grid">${cards}</div><div class="actions">${createButton("VIEW SUPPORT RESOURCES →", "resources")}${createButton("TAKE THE POST-TEST →", "postTest", "secondary")}</div>`), 9);
}

function showSupport() {
    renderScreen("support", screenWrapper(`<span class="eyebrow">Direct support</span><h2>You're not too late to ask for help.</h2><p class="lead">You do not have to wait until things become worse before reaching out.</p><div class="info-grid">${supportCards()}</div><div class="emergency-box"><h3>IF SOMEONE IS IN IMMEDIATE DANGER</h3><p>Seek emergency medical help immediately for situations such as:</p><ul><li>unconsciousness</li><li>severe breathing difficulty</li><li>seizure</li><li>serious injury</li><li>suspected poisoning or overdose</li><li>immediate danger to life</li></ul><p class="small">Do not rely on this webpage for emergency treatment instructions.</p></div><div class="research-note"><strong>Start with someone you trust.</strong><p>A doctor, counsellor, qualified health professional, or appropriate de-addiction service can help work out the next step.</p></div><div class="actions">${createButton("BACK TO HOME", "home", "secondary")}</div>`));
}

function showWorried() {
    const cards = [
        ["NOTICE", "Pay attention to patterns such as risky situations, secrecy, pressure, or using substances to cope.", "These signs do not by themselves prove substance use."],
        ["TALK", "Try: “I've noticed you're struggling. Do you want to talk?”", "Avoid labels, threats, or shame."],
        ["SUPPORT", "Listen. Encourage professional help. Don't promise secrecy when someone's safety is at risk."],
        ["GET HELP", "You can also contact an appropriate service for guidance on supporting someone."]
    ].map(([title, text, note]) => `<div class="info-card"><h3>${title}</h3><p class="muted">${text}</p>${note ? `<p class="small">${note}</p>` : ""}</div>`).join("");
    renderScreen("worried", screenWrapper(`<span class="eyebrow">For a friend or family member</span><h2>You don't have to handle this alone.</h2><p class="lead">Concern is not proof that someone is using drugs. Look at the situation, talk without judgment, and encourage appropriate support.</p><div class="info-grid">${cards}</div><div class="card support-card"><h3>Useful support numbers</h3><div class="info-grid">${supportCards()}</div></div><div class="actions">${createButton("BACK TO HOME", "home", "secondary")}</div>`));
}

function showResources() {
    renderScreen("resources", screenWrapper(`<span class="eyebrow">Support</span><h2>Keep this information.</h2><p class="lead">If this is about you or someone you know, reaching out is a valid next step.</p><div class="info-grid">${supportCards()}</div><div class="emergency-box"><h3>IMMEDIATE DANGER</h3><p>Seek emergency medical help immediately if someone's life may be at risk.</p></div><p class="small resource-note">Support information should be periodically re-verified before public deployment because services and numbers can change.</p><div class="actions">${createButton("TAKE THE POST-TEST →", "postTest")}${createButton("BACK TO HOME", "home", "secondary")}</div>`));
}

function showPostTest() {
    const configured = CONFIG.postTestUrl && !CONFIG.postTestUrl.includes("YOUR_GOOGLE_FORM_URL_HERE");
    const formButton = configured ? `<a href="${escapeHTML(CONFIG.postTestUrl)}" class="button button-primary" target="_blank" rel="noopener noreferrer">TAKE THE POST-TEST →</a>` : createButton("POST-TEST LINK NOT ADDED YET", "missingForm", "secondary");
    renderScreen("postTest", screenWrapper(`<span class="eyebrow">Follow-up</span><h2>You've completed Beyond Say No.</h2><p class="lead">Now take the short follow-up survey. The webpage is the intervention; the survey measures what changed.</p><div class="research-note"><strong>Research note</strong><p>The follow-up survey is separate from this webpage. Do not enter identifying information unless the research team explicitly instructs you to.</p></div><div class="actions">${formButton}${createButton("VIEW SUPPORT RESOURCES", "resources", "secondary")}${createButton("BACK TO HOME", "home", "quiet")}</div>`));
}

function showMissingFormMessage() {
    if (document.getElementById("postTestMessage")) return;
    const message = document.createElement("div");
    message.id = "postTestMessage";
    message.className = "feedback";
    message.innerHTML = `<div class="feedback-title">POST-TEST LINK NOT CONNECTED</div><p>Open <strong>script.js</strong> and replace <code>YOUR_GOOGLE_FORM_URL_HERE</code> with the URL of your Google Form.</p>`;
    dom.container.appendChild(message);
}

const ACTIONS = {
    home: showHome, scenario1: showScenario1, redFlags: showRedFlags,
    mythCheck: showMythCheck, nextMyth, peerPressure: showPeerPressure,
    misinformation: showMisinformation, someoneNeedsHelp: showSomeoneNeedsHelp,
    helpingFriend: showHelpingFriend, helpSeeking: showHelpSeeking,
    finalChallenge: showFinalChallenge, finalReveal: showFinalReveal,
    support: showSupport, worried: showWorried, resources: showResources,
    postTest: showPostTest, missingForm: showMissingFormMessage
};

function handleAction(action) {
    const handler = ACTIONS[action];
    if (handler) handler();
    else console.warn("Unknown action:", action);
}

function resetJourney() {
    if (state.currentScreen !== "home") {
        state.answers = createInitialAnswers();
        state.mythIndex = 0;
    }
}

function handleClick(event) {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.dataset.action) return handleAction(target.dataset.action);
    if (target.dataset.choice === "scenario1") return handleSingleChoice(target, choiceScreens.scenario1);
    if (target.dataset.redflag) return handleRedFlagChoice(target);
    if (target.dataset.mythChoice) return handleMythChoice(target);

    for (const screen of Object.values(choiceScreens)) {
        if (target.dataset[toDatasetKey(screen.attribute)]) {
            return handleSingleChoice(target, screen);
        }
    }
}

function handleKeydown(event) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (event.key === "Escape" && !["input", "textarea", "select"].includes(tag) && state.currentScreen !== "home") showHome();
}

function initialize() {
    dom.container = document.getElementById("app-container");
    if (!dom.container) throw new Error("Beyond Say No: #app-container was not found.");
    dom.progressContainer = document.getElementById("progressContainer");
    dom.progressLabel = document.getElementById("progressLabel");
    dom.progressBar = document.getElementById("progressBar");
    dom.headerHomeButton = document.getElementById("headerHomeButton");
    dom.brandButton = document.getElementById("brandButton");

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
    dom.headerHomeButton?.addEventListener("click", showHome);
    dom.brandButton?.addEventListener("click", showHome);
    showHome();
    console.log("Beyond Say No loaded successfully.");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
else initialize();
