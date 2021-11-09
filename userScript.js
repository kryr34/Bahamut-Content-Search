function bulitCSS() {
    let styles = `
    #search {
        float: right;
        min-width: min-content;
        animation-name: searchRe;
        animation-duration: 0.4s;
        animation-fill-mode: forwards;
    }
    #search:hover {
        animation-name: searchAn;
        animation-duration: 0.4s;
        animation-fill-mode: forwards;
    }
    #search input {
        width: 100%;
        box-sizing: border-box;
    }
    @keyframes searchAn {
        from {
            width: 50px;
            height: auto;
        }
        to {
            width: 150px;
            height: auto;
        }
    }
    @keyframes searchRe {
        from {
            width: 150px;
            height: auto;
        }
        to {
            width: 50px;
            height: auto;
        }
    }
    #result {
        width: 300px;
        height: 54px;
        border: 0;
        margin-bottom: 0;
        box-shadow: none;
        text-align: left;
        writing-mode: horizontal-tb;
        overflow: hidden;
    }
    [id='result box'] {
        float: right;
        width: auto;
        max-height: 400px;
        overflow: auto;
    }
    .jumpfloor {
        float: right;
    }
    `

    let styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)
}

function bulitSearchBox() {
    let div = document.createElement("div");
    let resultBox = document.createElement("div");
    let input = document.createElement("input");
    div.appendChild(resultBox);
    div.appendChild(input);
    div.className = "jumpfloor";
    div.id = "search";

    resultBox.id = "result box";

    input.id = "search box";
    input.type = "text";
    input.placeholder = "搜尋";
    input.addEventListener("keyup", event => {
        if (event.keyCode !== 13) return;
        const inputText = document.getElementById("search box").value;
        if (inputText == "") return;
        search(inputText);
    });

    const parentElement = document.getElementsByClassName("c-quicktool")[0];
    parentElement.insertBefore(div, parentElement.firstChild);
}

function search(queryText) {
    const re = new RegExp(queryText.replace(/\s+/gi, '|')); // convert "a b  c" to "a|b|c" and create regex object

    const url = document.URL
    .replace(/(&|\?)(to|page)=\d+/gi, '')
    .replace(/(&|\?)/, '?');

    let lastPage = document.getElementsByClassName("BH-pagebtnA")[0].lastChild.textContent;
    let results = new Map();
    const myPromise = new Promise((resolve, reject) => {
        const resultBox = document.getElementById("result box");
        while (resultBox.firstChild) resultBox.removeChild(resultBox.firstChild);
        let i = document.createElement("i");
        i.className = "goback";
        i.id = "result";
        i.innerHTML = "搜尋中...";
        resultBox.appendChild(i);
        resolve();
    })
    .then( () => {
        let array = [];
        for(let page = 1; page <= lastPage; page++) array.push(page);
        return array;
    })
    .then(array => array.map(page =>
        fetch_retry(`${url}&page=${page}`, {
            method: "GET",
            headers: {"Content-type": "text/html"}
        }, 100)
        .then(response => response.text())
        .then(html => (new DOMParser()).parseFromString(html, "text/html"))
        .then(dom => {
            const sections = dom.getElementsByClassName("c-section__main c-post ");
            for(let index = 0; index < sections.length; index++) {
                const section = sections.item(index);
                //console.log(section);
                if(re.test(section.getElementsByClassName("c-article__content")[0].innerText)) {
                    const postText = section.getElementsByClassName("c-article__content")[0].innerText;
                    const floor = section.getElementsByClassName("floor tippy-gpbp")[0].dataset.floor;
                    results.set(floor, postText);
                }
            }
        })
        .catch(console.error)
    ))
    .then(primises => {
        return Promise.all(primises)
    })
    .then( () => {
        const resultBox = document.getElementById("result box");
        while (resultBox.firstChild) resultBox.removeChild(resultBox.firstChild);
        if (results.size == 0) {
            let i = document.createElement("i");
            i.className = "goback";
            i.id = "result";
            i.innerHTML = "查無結果";
            resultBox.appendChild(i);
            return;
        }
        const sorted = new Map([...results.entries()].sort((a,b) => a[0] - b[0]))
        console.log(sorted);
        function bulitResultButton(postText, floor) {
            const resultBox = document.getElementById("result box");
            let button = document.createElement("a");
            button.className = "goback";
            button.id = "result";
            button.href = `${url}&to=${floor}`
            const pos = postText.search(re);
            const content = postText.substring(pos-20,pos+20).replaceAll(re,`<b>$&</b>`);
            button.innerHTML = `<u>${floor}樓</u> ${content}`;
            resultBox.appendChild(button);
        }
        sorted.forEach(bulitResultButton);
    })
    .catch(console.error);
}

const fetch_retry = async (url, options, n) => {
    for (let i = 0; i < n; i++) {
        try {
            return await fetch(url, options);
        } catch (err) {
            const isLastAttempt = i + 1 === n;
            if (isLastAttempt) throw err;
        }
    }
};

bulitCSS();
bulitSearchBox();
