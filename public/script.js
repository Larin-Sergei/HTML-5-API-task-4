// ==========================================
// ОБЩИЕ ЭЛЕМЕНТЫ
// ==========================================

const apiStatus =
    document.getElementById("apiStatus");

const apiData =
    document.getElementById("apiData");

const errorLog =
    document.getElementById("errorLog");


// ==========================================
// ОБРАБОТКА ОШИБОК
// ==========================================

function showError(message) {

    if (
        errorLog.textContent ===
        "Ошибок пока нет."
    ) {
        errorLog.textContent = "";
    }

    const element =
        document.createElement("div");

    element.className = "error-entry";

    element.textContent =
        `${new Date().toLocaleTimeString("ru-RU")} — ${message}`;

    errorLog.prepend(element);
}


// ==========================================
// FAKE API + FETCH
// ==========================================

const resourceSelect =
    document.getElementById("resourceSelect");

const loadDataButton =
    document.getElementById("loadDataButton");


loadDataButton.addEventListener(
    "click",
    loadFakeApiData
);


async function loadFakeApiData() {

    const resource =
        resourceSelect.value;

    const url =
        `https://jsonplaceholder.typicode.com/${resource}`;


    apiStatus.textContent =
        "Загрузка данных...";

    apiStatus.className =
        "status";


    apiData.innerHTML = "";


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `HTTP ошибка: ${response.status}`
            );

        }


        const data =
            await response.json();


        renderApiData(
            resource,
            data
        );


        apiStatus.textContent =
            `Загружено записей: ${data.length}`;

        apiStatus.className =
            "status success";


    } catch (error) {

        apiStatus.textContent =
            "Не удалось загрузить данные.";

        apiStatus.className =
            "status error";


        showError(
            `Fake API: ${error.message}`
        );

    }

}


function renderApiData(
    resource,
    data
) {

    const limitedData =
        data.slice(0, 20);


    limitedData.forEach((item) => {

        const element =
            document.createElement("div");

        element.className =
            "data-item";


        if (resource === "users") {

            element.innerHTML = `
                <h3>
                    ${escapeHTML(item.name)}
                </h3>

                <p>
                    <strong>Username:</strong>
                    ${escapeHTML(item.username)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(item.email)}
                </p>

                <p>
                    <strong>Телефон:</strong>
                    ${escapeHTML(item.phone)}
                </p>

                <p>
                    <strong>Город:</strong>
                    ${escapeHTML(item.address.city)}
                </p>
            `;

        }


        if (resource === "posts") {

            element.innerHTML = `
                <h3>
                    ${escapeHTML(item.title)}
                </h3>

                <p>
                    ${escapeHTML(item.body)}
                </p>

                <p>
                    <strong>User ID:</strong>
                    ${item.userId}
                </p>
            `;

        }


        if (resource === "comments") {

            element.innerHTML = `
                <h3>
                    ${escapeHTML(item.name)}
                </h3>

                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(item.email)}
                </p>

                <p>
                    ${escapeHTML(item.body)}
                </p>

                <p>
                    <strong>Post ID:</strong>
                    ${item.postId}
                </p>
            `;

        }


        apiData.appendChild(element);

    });

}


function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        String(value);

    return element.innerHTML;
}


// Загружаем пользователей сразу
loadFakeApiData();


// ==========================================
// SOCKET.IO CHAT
// ==========================================

const socket =
    io();


const socketStatus =
    document.getElementById("socketStatus");

const chatMessages =
    document.getElementById("chatMessages");

const username =
    document.getElementById("username");

const chatInput =
    document.getElementById("chatInput");

const sendMessage =
    document.getElementById("sendMessage");


socket.on("connect", () => {

    socketStatus.textContent =
        "WebSocket соединение установлено.";

    socketStatus.className =
        "status success";

});


socket.on("disconnect", () => {

    socketStatus.textContent =
        "WebSocket соединение потеряно. Попытка переподключения...";

    socketStatus.className =
        "status error";

});


socket.on("connect_error", (error) => {

    socketStatus.textContent =
        "Ошибка подключения к WebSocket.";

    socketStatus.className =
        "status error";


    showError(
        `WebSocket: ${error.message}`
    );

});


socket.on(
    "systemMessage",
    (data) => {

        addChatMessage(
            "Система",
            data.text,
            data.date,
            true
        );

    }
);


socket.on(
    "chatMessage",
    (data) => {

        addChatMessage(
            data.username,
            data.text,
            data.date,
            false
        );

    }
);


function sendChatMessage() {

    const text =
        chatInput.value.trim();

    const name =
        username.value.trim();


    if (!text) {
        return;
    }


    socket.emit(
        "chatMessage",
        {
            username:
                name || "Аноним",

            text: text
        }
    );


    chatInput.value = "";

    chatInput.focus();

}


sendMessage.addEventListener(
    "click",
    sendChatMessage
);


chatInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            sendChatMessage();

        }

    }
);


function addChatMessage(
    author,
    text,
    time,
    system
) {

    const element =
        document.createElement("div");

    element.className =
        "message";

    if (system) {
        element.classList.add("system");
    }


    const authorElement =
        document.createElement("span");

    authorElement.className =
        "message-author";

    authorElement.textContent =
        author;


    const timeElement =
        document.createElement("span");

    timeElement.className =
        "message-time";

    timeElement.textContent =
        time;


    const textElement =
        document.createElement("div");

    textElement.textContent =
        text;


    element.appendChild(
        authorElement
    );

    element.appendChild(
        timeElement
    );

    element.appendChild(
        textElement
    );


    chatMessages.appendChild(
        element
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ==========================================
// SERVER-SENT EVENTS
// ==========================================

const sseStatus =
    document.getElementById("sseStatus");

const sseMessages =
    document.getElementById("sseMessages");


let eventSource;


function connectSSE() {

    eventSource =
        new EventSource("/events");


    eventSource.onopen = () => {

        sseStatus.textContent =
            "SSE соединение установлено.";

        sseStatus.className =
            "status success";

    };


    eventSource.onmessage =
        (event) => {

            try {

                const data =
                    JSON.parse(event.data);


                if (
                    data.type ===
                    "connection"
                ) {

                    return;

                }


                addSSEPost(data);

            } catch (error) {

                showError(
                    `SSE: ${error.message}`
                );

            }

        };


    eventSource.onerror =
        () => {

            sseStatus.textContent =
                "Ошибка SSE соединения. Браузер пытается переподключиться...";

            sseStatus.className =
                "status error";


            showError(
                "Соединение Server-Sent Events потеряно."
            );

        };

}


function addSSEPost(data) {

    const element =
        document.createElement("div");

    element.className =
        "sse-post";


    const title =
        document.createElement("h3");

    title.textContent =
        data.title;


    const body =
        document.createElement("p");

    body.textContent =
        data.body;


    const date =
        document.createElement("div");

    date.className =
        "sse-date";

    date.textContent =
        data.date;


    element.appendChild(title);

    element.appendChild(body);

    element.appendChild(date);


    sseMessages.prepend(
        element
    );

}


connectSSE();