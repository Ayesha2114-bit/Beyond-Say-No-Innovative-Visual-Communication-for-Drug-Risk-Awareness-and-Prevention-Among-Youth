/* ============================================================
   BEYOND SAY NO
   Interactive Drug-Risk Awareness Intervention
   Vanilla JavaScript
   ============================================================ */


/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const CONFIG = {

    /*
        IMPORTANT:
        Replace this with your actual Google Form URL
        after your post-test form is ready.

        Example:

        postTestUrl:
            "https://docs.google.com/forms/d/e/XXXXXXXX/viewform"

    */

    postTestUrl: "https://forms.gle/DSPjpxLNj4CAroTG9",


    /*
        SUPPORT RESOURCES

        Keep all resource information here so it is easy
        to update later without searching through the code.
    */

    resources: {

        helpline: {

            name:
                "National Drug De-Addiction Helpline",

            number:
                "14446",

            description:
                "Support and referral related to substance-use concerns."

        },


        mentalHealth: {

            name:
                "Tele-MANAS",

            number:
                "14416",

            alternative:
                "1800-89-14416",

            description:
                "National tele-mental-health support service."

        }

    }

};


/* ============================================================
   2. GLOBAL APPLICATION STATE
   ============================================================ */

const state = {

    currentScreen:
        "home",

    interventionStep:
        0,

    totalSteps:
        9,

    /*
        Stores choices during the intervention.

        This is NOT a research database.

        Nothing is sent anywhere.
        Nothing is saved permanently.
    */

    answers: {

        scenario1:
            null,

        redFlags:
            [],

        myth1:
            null,

        myth2:
            null,

        myth3:
            null,

        peerPressure:
            null,

        misinformation:
            null,

        helpSeeking:
            null,

        helpingFriend:
            null,

        finalScenario:
            null

    },

    /*
        Used for the three-question Myth Check.
    */

    mythIndex:
        0

};


/* ============================================================
   3. MYTH CHECK DATA
   ============================================================ */

const mythQuestions = [

    {

        claim:
            "If someone only uses occasionally, there is no risk.",

        correct:
            "myth",

        explanation:
            "Frequency alone does not determine whether something is risky. Risk can depend on the substance, circumstances, pattern of use, amount, and the person."

    },


    {

        claim:
            "If everyone around you is doing it, it must be safe.",

        correct:
            "myth",

        explanation:
            "Popularity is not evidence of safety. A behaviour can become normalized within a group without becoming safe."

    },


    {

        claim:
            "Using a substance to deal with stress can become a risky coping pattern.",

        correct:
            "fact",

        explanation:
            "Using substances as a way to cope with stress can create additional risks and may make it harder to address the underlying problem."

    }

];


/* ============================================================
   4. DOM ELEMENTS
   ============================================================ */

const appContainer =
    document.getElementById("app-container");

const progressContainer =
    document.getElementById("progressContainer");

const progressLabel =
    document.getElementById("progressLabel");

const progressBar =
    document.getElementById("progressBar");

const headerHomeButton =
    document.getElementById("headerHomeButton");

const brandButton =
    document.getElementById("brandButton");


/* ============================================================
   5. BASIC SAFETY CHECK
   ============================================================ */

if (!appContainer) {

    throw new Error(
        "Beyond Say No: #app-container was not found."
    );

}


/* ============================================================
   6. HTML ESCAPING
   ============================================================ */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* ============================================================
   7. BUTTON HELPER
   ============================================================ */

function createButton(
    text,
    action,
    type = "primary",
    extraClass = ""
) {

    return `

        <button
            type="button"
            class="button button-${type} ${extraClass}"
            data-action="${escapeHTML(action)}"
        >

            ${escapeHTML(text)}

        </button>

    `;

}


/* ============================================================
   8. SCREEN WRAPPER
   ============================================================ */

function screenWrapper(content) {

    return `

        <section
            class="screen"
            aria-label="Beyond Say No screen"
        >

            ${content}

        </section>

    `;

}


/* ============================================================
   9. CHAT BUBBLE
   ============================================================ */

function chatBubble(
    speaker,
    message,
    right = false
) {

    return `

        <div
            class="chat-bubble ${right ? "right" : ""}"
        >

            <span class="chat-name">
                ${escapeHTML(speaker)}
            </span>

            ${escapeHTML(message)}

        </div>

    `;

}


/* ============================================================
   10. CHARACTER
   ============================================================ */

function createCharacter(
    role = "person",
    label = ""
) {

    return `

        <div
            class="character character-${escapeHTML(role)}"
            aria-hidden="true"
        >

            <div class="character-head"></div>

            <div
                class="character-eye left"
            ></div>

            <div
                class="character-eye right"
            ></div>

            <div
                class="character-body"
            ></div>

            ${
                role !== "helper"

                    ? `
                        <div
                            class="character-phone"
                        ></div>
                    `

                    : ""
            }

            ${
                label

                    ? `
                        <span class="character-label">
                            ${escapeHTML(label)}
                        </span>
                    `

                    : ""
            }

        </div>

    `;

}


/* ============================================================
   11. CHARACTER GROUP
   ============================================================ */

function characterGroup() {

    return `

        <div class="character-group">

            ${createCharacter(
                "peer",
                "pressure"
            )}

            ${createCharacter(
                "person",
                "you"
            )}

            ${createCharacter(
                "helper",
                "support"
            )}

        </div>

    `;

}


/* ============================================================
   12. CHARACTER STAGE
   ============================================================ */

function characterStage(
    speech = ""
) {

    return `

        <div
            class="character-stage"
        >

            ${characterGroup()}

            ${
                speech

                    ? `
                        <div
                            class="chat-bubble right"
                            style="
                                position:absolute;
                                top:20px;
                                right:18px;
                                max-width:220px;
                            "
                        >

                            <span class="chat-name">
                                Pause
                            </span>

                            ${escapeHTML(speech)}

                        </div>
                    `

                    : ""
            }

        </div>

    `;

}


/* ============================================================
   13. UPDATE PROGRESS
   ============================================================ */

function updateProgress(step) {

    state.interventionStep =
        step;

    if (
        step <= 0
        ||
        step > state.totalSteps
    ) {

        progressContainer.hidden =
            true;

        headerHomeButton.hidden =
            true;

        return;

    }


    progressContainer.hidden =
        false;

    headerHomeButton.hidden =
        false;


    progressLabel.textContent =
        `${String(step).padStart(2, "0")} / ${String(state.totalSteps).padStart(2, "0")}`;


    const percentage =
        (step / state.totalSteps) * 100;


    progressBar.style.width =
        `${percentage}%`;

}


/* ============================================================
   14. FOCUS SCREEN
   ============================================================ */

function focusScreen() {

    /*
        Small delay gives the browser time to insert
        the new screen before moving keyboard focus.
    */

    window.setTimeout(() => {

        appContainer.focus({
            preventScroll: true
        });

    }, 50);

}


/* ============================================================
   15. RENDER SCREEN
   ============================================================ */

function renderScreen(
    screenName,
    html,
    progress = 0
) {

    state.currentScreen =
        screenName;

    appContainer.innerHTML =
        html;

    updateProgress(progress);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    focusScreen();

}


/* ============================================================
   16. HOME SCREEN
   ============================================================ */

function showHome() {

    renderScreen(

        "home",

        screenWrapper(`

            <div class="hero">

                <div class="hero-copy">

                    <span class="eyebrow">
                        Interactive visual intervention
                    </span>


                    <h1>
                        BEYOND<br>
                        SAY NO
                    </h1>


                    <p class="lead">
                        Sometimes the risk isn't obvious.
                    </p>


                    <p class="muted hero-description">

                        Learn to spot risky situations,
                        question misinformation,
                        respond to pressure,
                        and know what to do next.

                    </p>


                    <div class="actions hero-actions">

                        ${createButton(
                            "EXPLORE THE CHALLENGE →",
                            "scenario1"
                        )}


                        ${createButton(
                            "I NEED SUPPORT →",
                            "support",
                            "secondary"
                        )}


                        ${createButton(
                            "I'M WORRIED ABOUT SOMEONE →",
                            "worried",
                            "secondary"
                        )}

                    </div>

                </div>


                <div class="hero-visual">

                    ${characterGroup()}


                    <div
                        class="chat-bubble right"
                        style="
                            position:absolute;
                            top:24px;
                            right:20px;
                            max-width:230px;
                        "
                    >

                        <span class="chat-name">
                            Pause
                        </span>

                        What do you notice
                        when the risk isn't obvious?

                    </div>

                </div>

            </div>

        `),

        0

    );

}


/* ============================================================
   17. SCENARIO 1
   ============================================================ */

function showScenario1() {

    renderScreen(

        "scenario1",

        screenWrapper(`

            <span class="eyebrow">
                01 • First scene
            </span>


            <h2>
                Something feels off.
            </h2>


            <p class="lead">

                Read the conversation.
                Then look for what deserves
                your attention.

            </p>


            <div class="story-layout">

                <div class="card story-main">

                    <div class="chat">

                        ${chatBubble(
                            "A",
                            "I've been really stressed lately."
                        )}

                        ${chatBubble(
                            "B",
                            "There's something that helps. Everyone does it.",
                            true
                        )}

                        ${chatBubble(
                            "A",
                            "I don't know..."
                        )}

                    </div>


                    <h3>
                        What do you notice?
                    </h3>


                    <p class="small">

                        Choose the response that best
                        identifies the situation.

                    </p>


                    <div class="choice-list">

                        <button
                            type="button"
                            class="choice-button"
                            data-choice="scenario1"
                            data-value="stress"
                        >
                            Stress is involved.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-choice="scenario1"
                            data-value="normalization"
                        >
                            Someone is normalizing the behaviour.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-choice="scenario1"
                            data-value="substance_solution"
                        >
                            A substance is being presented
                            as an easy solution.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-choice="scenario1"
                            data-value="all"
                        >
                            All of these.
                        </button>

                    </div>


                    <div
                        id="scenario1Feedback"
                        aria-live="polite"
                    ></div>

                </div>


                <div class="story-side">

                    ${characterStage(
                        "The first step is noticing."
                    )}

                </div>

            </div>

        `),

        1

    );

}


/* ============================================================
   18. RED FLAGS
   ============================================================ */

function showRedFlags() {

    renderScreen(

        "redFlags",

        screenWrapper(`

            <span class="eyebrow">
                02 • Risk recognition
            </span>


            <h2>
                Spot the red flags.
            </h2>


            <p class="lead">

                Tap the statements that would
                make you pause.

                More than one can be relevant.

            </p>


            <div class="card">

                <div class="chat">

                    ${chatBubble(
                        "Friend",
                        "I only do it when I'm stressed."
                    )}

                    ${chatBubble(
                        "Friend",
                        "It's not really dangerous.",
                        true
                    )}

                    ${chatBubble(
                        "Friend",
                        "Everyone around me does it."
                    )}

                </div>


                <div
                    class="choice-list"
                    id="redFlagChoices"
                >

                    <button
                        type="button"
                        class="choice-button"
                        data-redflag="1"
                    >
                        “I only do it when I'm stressed.”
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-redflag="2"
                    >
                        “It's not really dangerous.”
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-redflag="3"
                    >
                        “Everyone around me does it.”
                    </button>

                </div>


                <p class="small">

                    Select at least one statement
                    to continue.

                </p>


                <div
                    id="redFlagFeedback"
                    aria-live="polite"
                ></div>

            </div>

        `),

        2

    );

}


/* ============================================================
   19. MYTH CHECK
   ============================================================ */

function showMythCheck() {

    state.mythIndex =
        0;

    renderMythQuestion();

}


/* ============================================================
   20. RENDER CURRENT MYTH
   ============================================================ */

function renderMythQuestion() {

    const question =
        mythQuestions[state.mythIndex];


    renderScreen(

        "mythCheck",

        screenWrapper(`

            <span class="eyebrow">
                03 • Misinformation
            </span>


            <h2>
                Wait. Is that actually true?
            </h2>


            <p class="lead">

                Question confident claims
                instead of accepting them
                at face value.

            </p>


            <div class="card">

                <p class="scenario-number">

                    Claim
                    ${state.mythIndex + 1}
                    of
                    ${mythQuestions.length}

                </p>


                <h3>

                    ${escapeHTML(
                        question.claim
                    )}

                </h3>


                <div class="choice-list">

                    <button
                        type="button"
                        class="choice-button"
                        data-myth-choice="myth"
                    >
                        MYTH
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-myth-choice="fact"
                    >
                        FACT
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-myth-choice="unsure"
                    >
                        NOT SURE
                    </button>

                </div>


                <div
                    id="mythFeedback"
                    aria-live="polite"
                ></div>

            </div>

        `),

        3

    );

}


/* ============================================================
   21. PEER PRESSURE
   ============================================================ */

function showPeerPressure() {

    renderScreen(

        "peerPressure",

        screenWrapper(`

            <span class="eyebrow">
                04 • Peer pressure
            </span>


            <h2>
                The group chat.
            </h2>


            <p class="lead">

                Pressure can make an ordinary
                decision feel much harder.

            </p>


            <div class="story-layout">

                <div class="card">

                    <div class="chat">

                        ${chatBubble(
                            "Friend",
                            "Come on."
                        )}

                        ${chatBubble(
                            "Friend",
                            "Everyone's doing it.",
                            true
                        )}

                        ${chatBubble(
                            "Friend",
                            "Don't be boring."
                        )}

                    </div>


                    <h3>
                        What could you do?
                    </h3>


                    <div class="choice-list">

                        <button
                            type="button"
                            class="choice-button"
                            data-peer-choice="go_along"
                        >
                            Go along with them.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-peer-choice="boundary"
                        >
                            Say no and leave the situation.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-peer-choice="redirect"
                        >
                            Suggest something else or
                            change the situation.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-peer-choice="stay"
                        >
                            Stay because you don't want
                            to look different.
                        </button>

                    </div>


                    <div
                        id="peerFeedback"
                        aria-live="polite"
                    ></div>

                </div>


                <div class="story-side">

                    ${characterStage(
                        "You are allowed to step away."
                    )}

                </div>

            </div>

        `),

        4

    );

}


/* ============================================================
   22. MISINFORMATION
   ============================================================ */

function showMisinformation() {

    renderScreen(

        "misinformation",

        screenWrapper(`

            <span class="eyebrow">
                05 • Critical thinking
            </span>


            <h2>
                The misinformation trap.
            </h2>


            <p class="lead">

                A confident message isn't
                automatically a reliable one.

            </p>


            <div class="card">

                ${chatBubble(
                    "Group chat",
                    "Bro, this stuff helps you study. Way better than sleep 😂",
                    true
                )}


                <h3 style="margin-top:28px">

                    What should make you
                    question this message?

                </h3>


                <div class="choice-list">

                    <button
                        type="button"
                        class="choice-button"
                        data-misinfo-choice="solution"
                    >
                        It presents a substance
                        as a solution.
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-misinfo-choice="evidence"
                    >
                        No reliable evidence is provided.
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-misinfo-choice="confidence"
                    >
                        It uses confidence or popularity
                        instead of evidence.
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-misinfo-choice="all"
                    >
                        All of these.
                    </button>

                </div>


                <div
                    id="misinfoFeedback"
                    aria-live="polite"
                ></div>

            </div>

        `),

        5

    );

}


/* ============================================================
   23. SOMEONE NEEDS HELP
   ============================================================ */

function showSomeoneNeedsHelp() {

    renderScreen(

        "someoneNeedsHelp",

        screenWrapper(`

            <span class="eyebrow">
                06 • Asking for help
            </span>


            <h2>
                Someone wants help.
            </h2>


            <p class="lead">

                A person doesn't have to wait
                until everything gets worse
                before asking for support.

            </p>


            <div class="story-layout">

                <div class="card">

                    <div class="chat">

                        ${chatBubble(
                            "A",
                            "I think I've started relying on it when I'm stressed."
                        )}

                        ${chatBubble(
                            "A",
                            "I don't know if it's becoming a problem."
                        )}

                        ${chatBubble(
                            "A",
                            "I think I might need help."
                        )}

                    </div>


                    <h3>
                        What could happen next?
                    </h3>


                    <div class="choice-list">

                        <button
                            type="button"
                            class="choice-button"
                            data-help-choice="alone"
                        >
                            Keep it secret and hope
                            it goes away.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-help-choice="trusted"
                        >
                            Talk to someone trustworthy.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-help-choice="professional"
                        >
                            Seek professional help.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-help-choice="information"
                        >
                            Look for reliable support
                            and information.
                        </button>


                        <button
                            type="button"
                            class="choice-button"
                            data-help-choice="wait"
                        >
                            Wait until the problem
                            becomes serious.
                        </button>

                    </div>


                    <div
                        id="helpFeedback"
                        aria-live="polite"
                    ></div>

                </div>


                <div class="story-side">

                    ${characterStage(
                        "Asking for help is a next step."
                    )}

                </div>

            </div>

        `),

        6

    );

}


/* ============================================================
   24. HELPING A FRIEND
   ============================================================ */

function showHelpingFriend() {

    renderScreen(

        "helpingFriend",

        screenWrapper(`

            <span class="eyebrow">
                07 • Supporting someone
            </span>


            <h2>
                Your friend tells you.
            </h2>


            <p class="lead">

                Supporting someone does not mean
                having to solve the entire problem
                yourself.

            </p>


            <div class="card">

                <div class="chat">

                    ${chatBubble(
                        "Friend",
                        "I've been using something when I'm stressed."
                    )}

                    ${chatBubble(
                        "Friend",
                        "I don't really know how to stop."
                    )}

                    ${chatBubble(
                        "Friend",
                        "How do I even tell someone?"
                    )}

                </div>


                <h3>
                    How would you respond?
                </h3>


                <div class="choice-list">

                    <button
                        type="button"
                        class="choice-button"
                        data-friend-choice="stop"
                    >
                        “Just stop. It's that simple.”
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-friend-choice="secret"
                    >
                        “Don't tell anyone.
                        I'll keep it secret.”
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-friend-choice="support"
                    >
                        “I'm glad you told me.
                        Let's find someone who can help.”
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-friend-choice="dismiss"
                    >
                        “Everyone has problems.
                        You'll be fine.”
                    </button>

                </div>


                <div
                    id="friendFeedback"
                    aria-live="polite"
                ></div>

            </div>

        `),

        7

    );

}


/* ============================================================
   25. HELP-SEEKING PATHWAY
   ============================================================ */

function showHelpSeeking() {

    renderScreen(

        "helpSeeking",

        screenWrapper(`

            <span class="eyebrow">
                08 • Help-seeking
            </span>


            <h2>
                Okay. What happens next?
            </h2>


            <p class="lead">

                You don't have to solve
                everything alone.

            </p>


            <div class="card">

                <h3>

                    Someone is worried about
                    their own substance use.

                    What is a reasonable
                    next step?

                </h3>


                <div class="choice-list">

                    <button
                        type="button"
                        class="choice-button"
                        data-seeking-choice="alone"
                    >
                        Keep it completely to yourself.
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-seeking-choice="social"
                    >
                        Search random social-media advice.
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-seeking-choice="professional"
                    >
                        Talk to a trusted person
                        and/or qualified professional.
                    </button>


                    <button
                        type="button"
                        class="choice-button"
                        data-seeking-choice="wait"
                    >
                        Wait until the problem becomes serious.
                    </button>

                </div>


                <div
                    id="seekingFeedback"
                    aria-live="polite"
                ></div>

            </div>

        `),

        8

    );

}


/* ============================================================
   26. FINAL INTEGRATED SCENARIO
   ============================================================ */

function showFinalChallenge() {

    renderScreen(

        "finalChallenge",

        screenWrapper(`

            <span class="eyebrow">
                09 • Put it together
            </span>


            <h2>
                One last situation.
            </h2>


            <p class="lead">

                Apply what you've learned
                to a new situation.

            </p>


            <div class="card">

                <p>

                    Your friend has been under
                    heavy stress.

                </p>


                <p>

                    Someone tells them a substance
                    will help them cope.

                </p>


                <p>

                    They hear:

                    <strong>
                        “Everyone does it.”
                    </strong>

                </p>


                <p>

                    Later, they privately say
                    they're worried about their use.

                </p>


                <div class="feedback">

                    <div class="feedback-title">
                        Pause.
                    </div>

                    <p>

                        What are the warning signs?

                        What claim should be questioned?

                        What support could help?

                    </p>

                </div>


                <div class="actions">

                    ${createButton(
                        "I'M READY →",
                        "finalReveal"
                    )}

                </div>

            </div>

        `),

        9

    );

}


/* ============================================================
   27. FINAL REVEAL
   ============================================================ */

function showFinalReveal() {

    renderScreen(

        "finalReveal",

        screenWrapper(`

            <div class="final-message">

                <span class="eyebrow">
                    You spotted the signals
                </span>


                <h2>
                    Recognize → Question → Support.
                </h2>


                <p class="lead">

                    You don't need to know everything.

                    You need to recognize when
                    something isn't right —

                    and know what to do next.

                </p>

            </div>


            <div class="info-grid">

                <div class="info-card">

                    <h3>
                        RECOGNIZE
                    </h3>

                    <p class="muted">

                        Notice risky coping,
                        pressure, normalization,
                        and unsupported claims.

                    </p>

                </div>


                <div class="info-card">

                    <h3>
                        QUESTION
                    </h3>

                    <p class="muted">

                        Popularity and confidence
                        are not evidence of safety.

                    </p>

                </div>


                <div class="info-card">

                    <h3>
                        SUPPORT
                    </h3>

                    <p class="muted">

                        Listen without shaming
                        and encourage appropriate help.

                    </p>

                </div>


                <div class="info-card">

                    <h3>
                        SEEK HELP
                    </h3>

                    <p class="muted">

                        Trusted people and qualified
                        professionals can help with
                        the next step.

                    </p>

                </div>

            </div>


            <div class="actions">

                ${createButton(
                    "VIEW SUPPORT RESOURCES →",
                    "resources"
                )}


                ${createButton(
                    "TAKE THE POST-TEST →",
                    "postTest",
                    "secondary"
                )}

            </div>

        `),

        9

    );

}


/* ============================================================
   28. RESOURCE CARD
   ============================================================ */

function resourceCard(resource) {

    const alternative =
        resource.alternative

            ? `

                <p class="small">

                    Alternative:

                    <strong>
                        ${escapeHTML(
                            resource.alternative
                        )}
                    </strong>

                </p>

            `

            : "";


    return `

        <div class="info-card">

            <h3>
                ${escapeHTML(resource.name)}
            </h3>


            <div class="resource-number">

                ${escapeHTML(resource.number)}

            </div>


            <p class="muted">

                ${escapeHTML(resource.description)}

            </p>


            ${alternative}


            <a
                class="call-button"
                href="tel:${escapeHTML(resource.number)}"
            >
                CALL ${escapeHTML(resource.number)}
            </a>


            ${
                resource.alternative

                    ? `

                        <a
                            class="call-button"
                            href="tel:${escapeHTML(resource.alternative)}"
                        >
                            CALL ALTERNATIVE
                        </a>

                    `

                    : ""
            }

        </div>

    `;

}


/* ============================================================
   29. DIRECT SUPPORT
   ============================================================ */

function showSupport() {

    renderScreen(

        "support",

        screenWrapper(`

            <span class="eyebrow">
                Direct support
            </span>


            <h2>
                You're not too late to ask for help.
            </h2>


            <p class="lead">

                You do not have to wait until
                things become worse before
                reaching out.

            </p>


            <div class="info-grid">

                ${resourceCard(
                    CONFIG.resources.helpline
                )}


                ${resourceCard(
                    CONFIG.resources.mentalHealth
                )}

            </div>


            <div class="emergency-box">

                <h3>
                    IF SOMEONE IS IN IMMEDIATE DANGER
                </h3>


                <p>

                    Seek emergency medical help
                    immediately for situations such as:

                </p>


                <ul>

                    <li>
                        unconsciousness
                    </li>

                    <li>
                        severe breathing difficulty
                    </li>

                    <li>
                        seizure
                    </li>

                    <li>
                        serious injury
                    </li>

                    <li>
                        suspected poisoning or overdose
                    </li>

                    <li>
                        immediate danger to life
                    </li>

                </ul>


                <p class="small">

                    Do not rely on this webpage
                    for emergency treatment instructions.

                </p>

            </div>


            <div class="research-note">

                <strong>
                    Start with someone you trust.
                </strong>


                <p>

                    A doctor, counsellor, qualified
                    health professional, or appropriate
                    de-addiction service can help work
                    out the next step.

                </p>

            </div>


            <div class="actions">

                ${createButton(
                    "BACK TO HOME",
                    "home",
                    "secondary"
                )}

            </div>

        `),

        0

    );

}


/* ============================================================
   30. WORRIED ABOUT SOMEONE
   ============================================================ */

function showWorried() {

    renderScreen(

        "worried",

        screenWrapper(`

            <span class="eyebrow">
                For a friend or family member
            </span>


            <h2>
                You don't have to handle this alone.
            </h2>


            <p class="lead">

                Concern is not proof that someone
                is using drugs.

                Look at the situation,
                talk without judgment,
                and encourage appropriate support.

            </p>


            <div class="info-grid">

                <div class="info-card">

                    <h3>
                        NOTICE
                    </h3>

                    <p class="muted">

                        Pay attention to patterns such
                        as risky situations, secrecy,
                        pressure, or using substances
                        to cope.

                    </p>

                    <p class="small">

                        These signs do not by themselves
                        prove substance use.

                    </p>

                </div>


                <div class="info-card">

                    <h3>
                        TALK
                    </h3>

                    <p class="muted">

                        Try:

                        “I've noticed you're struggling.
                        Do you want to talk?”

                    </p>

                    <p class="small">

                        Avoid labels, threats, or shame.

                    </p>

                </div>


                <div class="info-card">

                    <h3>
                        SUPPORT
                    </h3>

                    <p class="muted">

                        Listen.

                        Encourage professional help.

                        Don't promise secrecy when
                        someone's safety is at risk.

                    </p>

                </div>


                <div class="info-card">

                    <h3>
                        GET HELP
                    </h3>

                    <p class="muted">

                        You can also contact an
                        appropriate service for guidance
                        on supporting someone.

                    </p>

                </div>

            </div>


            <div class="card" style="margin-top:18px;">

                <h3>
                    Useful support numbers
                </h3>


                <div class="info-grid">

                    ${resourceCard(
                        CONFIG.resources.helpline
                    )}


                    ${resourceCard(
                        CONFIG.resources.mentalHealth
                    )}

                </div>

            </div>


            <div class="actions">

                ${createButton(
                    "BACK TO HOME",
                    "home",
                    "secondary"
                )}

            </div>

        `),

        0

    );

}


/* ============================================================
   31. GENERAL RESOURCES
   ============================================================ */

function showResources() {

    renderScreen(

        "resources",

        screenWrapper(`

            <span class="eyebrow">
                Support
            </span>


            <h2>
                Keep this information.
            </h2>


            <p class="lead">

                If this is about you or someone
                you know, reaching out is a valid
                next step.

            </p>


            <div class="info-grid">

                ${resourceCard(
                    CONFIG.resources.helpline
                )}


                ${resourceCard(
                    CONFIG.resources.mentalHealth
                )}

            </div>


            <div class="emergency-box">

                <h3>
                    IMMEDIATE DANGER
                </h3>


                <p>

                    Seek emergency medical help
                    immediately if someone's life
                    may be at risk.

                </p>

            </div>


            <p class="small" style="margin-top:18px;">

                Support information should be
                periodically re-verified before
                public deployment because services
                and numbers can change.

            </p>


            <div class="actions">

                ${createButton(
                    "TAKE THE POST-TEST →",
                    "postTest"
                )}


                ${createButton(
                    "BACK TO HOME",
                    "home",
                    "secondary"
                )}

            </div>

        `),

        0

    );

}


/* ============================================================
   32. POST-TEST SCREEN
   ============================================================ */

function showPostTest() {

    const formConfigured =
        CONFIG.postTestUrl &&
        !CONFIG.postTestUrl.includes(
            "YOUR_GOOGLE_FORM_URL_HERE"
        );


    const formButton =
        formConfigured

            ? `

                <a
                    href="${escapeHTML(
                        CONFIG.postTestUrl
                    )}"
                    class="button button-primary"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        text-decoration:none;
                    "
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    TAKE THE POST-TEST →
                </a>

            `

            : createButton(
                "POST-TEST LINK NOT ADDED YET",
                "missingForm",
                "secondary"
            );


    renderScreen(

        "postTest",

        screenWrapper(`

            <span class="eyebrow">
                Follow-up
            </span>


            <h2>
                You've completed
                Beyond Say No.
            </h2>


            <p class="lead">

                Now take the short follow-up survey.

                The webpage is the intervention;

                the survey measures what changed.

            </p>


            <div class="research-note">

                <strong>
                    Research note
                </strong>


                <p>

                    The follow-up survey is separate
                    from this webpage.

                    Do not enter identifying
                    information unless the research
                    team explicitly instructs you to.

                </p>

            </div>


            <div class="actions">

                ${formButton}


                ${createButton(
                    "VIEW SUPPORT RESOURCES",
                    "resources",
                    "secondary"
                )}


                ${createButton(
                    "BACK TO HOME",
                    "home",
                    "quiet"
                )}

            </div>

        `),

        0

    );

}


/* ============================================================
   33. FEEDBACK HELPER
   ============================================================ */

function insertFeedback(
    elementId,
    title,
    message,
    nextAction,
    nextText = "NEXT →"
) {

    const element =
        document.getElementById(elementId);


    if (!element) {

        return;

    }


    element.innerHTML = `

        <div class="feedback">

            <div class="feedback-title">

                ${escapeHTML(title)}

            </div>


            <p>

                ${escapeHTML(message)}

            </p>

        </div>


        <div class="actions">

            ${createButton(
                nextText,
                nextAction
            )}

        </div>

    `;

}


/* ============================================================
   34. SCENARIO 1 CHOICE HANDLER
   ============================================================ */

function handleScenario1Choice(button) {

    const value =
        button.dataset.value;


    state.answers.scenario1 =
        value;


    document
        .querySelectorAll(
            '[data-choice="scenario1"]'
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    let message =
        "";


    if (value === "all") {

        message =
            "Exactly. Stress, normalization, and presenting substance use as an easy solution can all be warning signs worth paying attention to.";

    }

    else {

        message =
            "Good observation. That is one important signal. There are multiple signals in this situation, so look at the whole pattern rather than one statement alone.";

    }


    insertFeedback(
        "scenario1Feedback",
        "THINK IT THROUGH",
        message,
        "redFlags"
    );

}


/* ============================================================
   35. RED FLAG HANDLER
   ============================================================ */

function handleRedFlagChoice(button) {

    const value =
        button.dataset.redflag;


    const index =
        state.answers.redFlags.indexOf(
            value
        );


    if (index === -1) {

        state.answers.redFlags.push(
            value
        );

        button.classList.add(
            "selected"
        );

    }

    else {

        state.answers.redFlags.splice(
            index,
            1
        );

        button.classList.remove(
            "selected"
        );

    }


    const feedback =
        document.getElementById(
            "redFlagFeedback"
        );


    if (
        state.answers.redFlags.length === 0
    ) {

        feedback.innerHTML = "";

        return;

    }


    feedback.innerHTML = `

        <div class="feedback">

            <div class="feedback-title">
                GOOD OBSERVATION
            </div>

            <p>

                Using a substance to cope with
                stress, minimizing risks, and
                treating popularity as proof
                of safety are all reasons to
                pause and look more closely.

            </p>

        </div>


        <div class="actions">

            ${createButton(
                "NEXT →",
                "mythCheck"
            )}

        </div>

    `;

}


/* ============================================================
   36. MYTH HANDLER
   ============================================================ */

function handleMythChoice(button) {

    const selected =
        button.dataset.mythChoice;


    const question =
        mythQuestions[
            state.mythIndex
        ];


    const correct =
        selected === question.correct;


    if (state.mythIndex === 0) {

        state.answers.myth1 =
            selected;

    }

    else if (state.mythIndex === 1) {

        state.answers.myth2 =
            selected;

    }

    else {

        state.answers.myth3 =
            selected;

    }


    document
        .querySelectorAll(
            "[data-myth-choice]"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    const feedback =
        document.getElementById(
            "mythFeedback"
        );


    const title =
        correct
            ? "CORRECT"
            : "KEEP QUESTIONING";


    feedback.innerHTML = `

        <div class="feedback">

            <div class="feedback-title">

                ${title}

            </div>


            <p>

                ${escapeHTML(
                    question.explanation
                )}

            </p>

        </div>


        <div class="actions">

            ${createButton(
                state.mythIndex <
                    mythQuestions.length - 1

                    ? "NEXT CLAIM →"

                    : "CONTINUE →",

                "nextMyth"
            )}

        </div>

    `;

}


/* ============================================================
   37. NEXT MYTH
   ============================================================ */

function nextMyth() {

    if (
        state.mythIndex <
        mythQuestions.length - 1
    ) {

        state.mythIndex++;

        renderMythQuestion();

        return;

    }


    showPeerPressure();

}


/* ============================================================
   38. PEER PRESSURE HANDLER
   ============================================================ */

function handlePeerChoice(button) {

    const value =
        button.dataset.peerChoice;


    state.answers.peerPressure =
        value;


    document
        .querySelectorAll(
            "[data-peer-choice]"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    let message;


    if (
        value === "boundary" ||
        value === "redirect"
    ) {

        message =
            "Those are ways to create distance from the pressure without having to prove yourself to the group.";

    }

    else {

        message =
            "Pressure can make a risky decision feel normal. You can set a boundary, leave the situation, or redirect what is happening.";

    }


    insertFeedback(
        "peerFeedback",
        "PAUSE",
        message,
        "misinformation"
    );

}


/* ============================================================
   39. MISINFORMATION HANDLER
   ============================================================ */

function handleMisinformationChoice(button) {

    const value =
        button.dataset.misinfoChoice;


    state.answers.misinformation =
        value;


    document
        .querySelectorAll(
            "[data-misinfo-choice]"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    insertFeedback(

        "misinfoFeedback",

        "QUESTION THE CLAIM",

        "Confidence is not evidence. Personal stories, jokes, social-media claims, and “everyone knows” statements do not prove that something is safe or effective.",

        "someoneNeedsHelp"

    );

}


/* ============================================================
   40. HELP-SEEKING / PERSON NEEDS HELP
   ============================================================ */

function handleHelpChoice(button) {

    const value =
        button.dataset.helpChoice;


    state.answers.helpSeeking =
        value;


    document
        .querySelectorAll(
            "[data-help-choice]"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    let message;


    if (
        value === "trusted" ||
        value === "professional" ||
        value === "information"
    ) {

        message =
            "Asking for help early is a valid option. Trusted people, qualified professionals, and appropriate support services can help with the next step.";

    }

    else {

        message =
            "Waiting or handling everything completely alone can make it harder to get support. A person can ask for help before things become more serious.";

    }


    insertFeedback(
        "helpFeedback",
        "A NEXT STEP",
        message,
        "helpingFriend"
    );

}


/* ============================================================
   41. HELPING FRIEND HANDLER
   ============================================================ */

function handleFriendChoice(button) {

    const value =
        button.dataset.friendChoice;


    state.answers.helpingFriend =
        value;


    document
        .querySelectorAll(
            "[data-friend-choice]"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    let message;


    if (value === "support") {

        message =
            "Listening without shaming someone and encouraging appropriate help can make it easier for them to seek support.";

    }

    else if (value === "secret") {

        message =
            "You can support someone without promising secrecy when safety may be at risk.";

    }

    else {

        message =
            "Dismissive or judgmental responses can make someone less comfortable seeking help. Support starts with listening.";

    }


    insertFeedback(
        "friendFeedback",
        "SUPPORT WITHOUT SHAME",
        message,
        "helpSeeking"
    );

}


/* ============================================================
   42. HELP-SEEKING HANDLER
   ============================================================ */

function handleSeekingChoice(button) {

    const value =
        button.dataset.seekingChoice;


    state.answers.helpSeeking =
        value;


    document
        .querySelectorAll(
            "[data-seeking-choice]"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    let message;


    if (value === "professional") {

        message =
            "A trusted person and/or qualified professional can help someone understand what to do next. You don't have to solve everything alone.";

    }

    else {

        message =
            "Reliable support from trusted people or qualified professionals can be a more useful next step than secrecy, random social-media advice, or waiting.";

    }


    insertFeedback(
        "seekingFeedback",
        "NEXT STEP",
        message,
        "finalChallenge"
    );

}


/* ============================================================
   43. EVENT DELEGATION
   ============================================================ */

document.addEventListener(
    "click",
    function(event) {

        const target =
            event.target.closest(
                "button, a"
            );


        if (!target) {

            return;

        }


        /*
            Main navigation buttons
        */

        const action =
            target.dataset.action;


        if (action) {

            handleAction(action);

            return;

        }


        /*
            Scenario 1
        */

        if (
            target.dataset.choice ===
            "scenario1"
        ) {

            handleScenario1Choice(
                target
            );

            return;

        }


        /*
            Red flags
        */

        if (
            target.dataset.redflag
        ) {

            handleRedFlagChoice(
                target
            );

            return;

        }


        /*
            Myth check
        */

        if (
            target.dataset.mythChoice
        ) {

            handleMythChoice(
                target
            );

            return;

        }


        /*
            Peer pressure
        */

        if (
            target.dataset.peerChoice
        ) {

            handlePeerChoice(
                target
            );

            return;

        }


        /*
            Misinformation
        */

        if (
            target.dataset.misinfoChoice
        ) {

            handleMisinformationChoice(
                target
            );

            return;

        }


        /*
            Person needs help
        */

        if (
            target.dataset.helpChoice
        ) {

            handleHelpChoice(
                target
            );

            return;

        }


        /*
            Helping friend
        */

        if (
            target.dataset.friendChoice
        ) {

            handleFriendChoice(
                target
            );

            return;

        }


        /*
            Help seeking
        */

        if (
            target.dataset.seekingChoice
        ) {

            handleSeekingChoice(
                target
            );

            return;

        }

    }
);


/* ============================================================
   44. ACTION ROUTER
   ============================================================ */

function handleAction(action) {

    switch (action) {


        /* HOME */

        case "home":

            showHome();

            break;


        /* INTERVENTION */

        case "scenario1":

            showScenario1();

            break;


        case "redFlags":

            showRedFlags();

            break;


        case "mythCheck":

            showMythCheck();

            break;


        case "nextMyth":

            nextMyth();

            break;


        case "peerPressure":

            showPeerPressure();

            break;


        case "misinformation":

            showMisinformation();

            break;


        case "someoneNeedsHelp":

            showSomeoneNeedsHelp();

            break;


        case "helpingFriend":

            showHelpingFriend();

            break;


        case "helpSeeking":

            showHelpSeeking();

            break;


        case "finalChallenge":

            showFinalChallenge();

            break;


        case "finalReveal":

            showFinalReveal();

            break;


        /* SUPPORT */

        case "support":

            showSupport();

            break;


        case "worried":

            showWorried();

            break;


        case "resources":

            showResources();

            break;


        /* POST TEST */

        case "postTest":

            showPostTest();

            break;


        case "missingForm":

            showMissingFormMessage();

            break;


        default:

            console.warn(
                "Unknown action:",
                action
            );

    }

}


/* ============================================================
   45. MISSING GOOGLE FORM MESSAGE
   ============================================================ */

function showMissingFormMessage() {

    const existing =
        document.getElementById(
            "postTestMessage"
        );


    if (existing) {

        return;

    }


    const message =
        document.createElement(
            "div"
        );


    message.id =
        "postTestMessage";


    message.className =
        "feedback";


    message.innerHTML = `

        <div class="feedback-title">

            POST-TEST LINK NOT CONNECTED

        </div>


        <p>

            Open <strong>script.js</strong>
            and replace:

        </p>


        <p>

            <code>
                YOUR_GOOGLE_FORM_URL_HERE
            </code>

        </p>


        <p>

            with the URL of your Google Form.

        </p>

    `;


    appContainer
        .appendChild(message);

}


/* ============================================================
   46. HEADER HOME BUTTON
   ============================================================ */

if (headerHomeButton) {

    headerHomeButton.addEventListener(
        "click",
        function() {

            showHome();

        }
    );

}


/* ============================================================
   47. BRAND BUTTON
   ============================================================ */

if (brandButton) {

    brandButton.addEventListener(
        "click",
        function() {

            showHome();

        }
    );

}


/* ============================================================
   48. KEYBOARD SUPPORT
   ============================================================ */

document.addEventListener(
    "keydown",
    function(event) {

        /*
            Escape returns to home.

            We do not do this while the user is
            typing inside a form field.
        */

        const tag =
            document.activeElement
                ?.tagName
                ?.toLowerCase();


        const typing =
            tag === "input" ||
            tag === "textarea" ||
            tag === "select";


        if (
            event.key === "Escape" &&
            !typing &&
            state.currentScreen !== "home"
        ) {

            showHome();

        }

    }
);


/* ============================================================
   49. INITIALIZE APPLICATION
   ============================================================ */

showHome();


/* ============================================================
   50. DEVELOPMENT MESSAGE
   ============================================================ */

console.log(
    "Beyond Say No loaded successfully."
);