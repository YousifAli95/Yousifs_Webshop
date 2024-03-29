////// Variables //////

const fromSlider = document.querySelector("#fromSlider");
const toSlider = document.querySelector("#toSlider");
const fromInput = document.querySelector("#fromInput");
const toInput = document.querySelector("#toInput");
const fromSliderHK = document.querySelector("#fromSliderHK");
const toSliderHK = document.querySelector("#toSliderHK");
const fromInputHK = document.querySelector("#fromInputHK");
const toInputHK = document.querySelector("#toInputHK");
const allTypes = document.querySelectorAll(".kategori");
const allMaterials = document.querySelectorAll(".material");
const selectElement = document.querySelector("#sort");
const filterElement = document.querySelector(".filter");
const mainElement = document.querySelector(".main-div");
const hamburgerMenuSVG = document.querySelector("#hamburger");

const SVG_COMPARE_FILL_CLASS = "svg-compare-fill"
const HEART_FILL_CLASS = "heart-fill"

var maxPrice = toInput.value;

var minPrice = fromInput.value;
var maxHK = toInputHK.value;
var minHK = fromInputHK.value;
var sortOn = selectElement.value.substr(1);
var isAscending = true;
var types = "-";
var materials = "-";
var numberOfCompares = 0;

////// EventListeners //////
allTypes.forEach((o) => {
    types += " " + o.value;
    o.addEventListener("change", function () {
        if (this.checked) {
            types += " " + this.value;
            getPartialView();
        } else {
            types = types.replace(" " + this.value, "");
            getPartialView();
        }
    });
});

allMaterials.forEach((o) => {
    materials += " " + o.value;
    o.addEventListener("change", function () {
        if (this.checked) {
            materials += " " + this.value;
            getPartialView();
        } else {
            materials = materials.replace(" " + this.value, "");
            getPartialView();
        }
    });
});
const constMaxPrice = maxPrice;
const constMinPrice = minPrice;
const constSortOn = sortOn;
const constMaxHK = maxHK;
const constMinHK = minHK;
const constIsAscending = isAscending;
const constMaterials = materials;
const constTyper = types;

selectElement.addEventListener("change", (event) => {
    sortOn = event.target.value.slice(1);
    isAscending = Boolean(parseInt(event.target.value.substr(0, 1)));
    getPartialView();
});


////// Functions /////
async function getPartialView() {
    const superContainer = document.querySelector(".card-container");
    const url = `/IndexPartial/?maxPrice=${maxPrice}&minPrice=${minPrice}&maxHK=${maxHK}&minHK=${minHK}&typer=${types}&materials=${materials}&sortOn=${sortOn}&isAscending=${isAscending}`;
    await fetch(url,
        { method: "GET" }
    )
        .then((result) => result.text())
        .then((html) => {
            superContainer.innerHTML = html;
        })
        .then((o) => {
            getCompare();
            getHearts();
        });
}

async function resetFilter() {
    {
        toSlider.value = constMaxPrice;
        fromSlider.value = constMinPrice;
        toSliderHK.value = constMaxHK;
        fromSliderHK.value = constMinHK;
        toInput.value = constMaxPrice;
        fromInput.value = constMinPrice;
        toInputHK.value = constMaxHK;
        fromInputHK.value = constMinHK;

        controlFromSlider(fromSlider, toSlider, fromInput);
        controlToSlider(fromSlider, toSlider, toInput);
        controlFromInput(fromSlider, fromInput, toInput, toSlider);
        controlToInput(toSlider, fromInput, toInput, toSlider);
        controlFromSlider(fromSliderHK, toSliderHK, fromInputHK);
        controlToSlider(fromSliderHK, toSliderHK, toInputHK);
        controlFromInput(fromSliderHK, fromInputHK, toInputHK, toSliderHK);
        controlToInput(toSliderHK, fromInputHK, toInputHK, toSliderHK);
    }

    allTypes.forEach((o) => {
        o.checked = true;
    });
    allMaterials.forEach((o) => (o.checked = true));

    maxPrice = constMaxPrice;
    minPrice = constMinPrice;
    sortOn = constSortOn;
    maxHK = constMaxHK;
    minHK = constMinHK;
    isAscending = constIsAscending;
    materials = constMaterials;
    types = constTyper;
    getPartialView();
}

function hideProperty(id, minus) {
    if (id.style.height != "0px") {
        id.style.height = "0";
    } else {
        id.style.height = "auto";
    }
    var id = "svg" + minus;
    var minusP = document.getElementById(id);
    if (minusP.innerHTML == '<path d="M0 10h24v4h-24z"></path>') {
        minusP.innerHTML = '<path d="M24 9h-9v-9h-6v9h-9v6h9v9h6v-9h9z"></path>';
    } else if (
        minusP.innerHTML == '<path d="M24 9h-9v-9h-6v9h-9v6h9v9h6v-9h9z"></path>'
    ) {
        minusP.innerHTML = '<path d="M0 10h24v4h-24z"></path>';
    }
}

async function compare(articleNr) {
    const svg = document.querySelector("#svg-" + articleNr);
    const MAX_ALLOWED_COMPARES = 4;

    // Check if the article will be added to the compare list and if the compare list can add one more article
    if (numberOfCompares >= MAX_ALLOWED_COMPARES && !svg.classList.contains(SVG_COMPARE_FILL_CLASS)) {
        // Don't allow the the article to be added to the compare list
        alert("Du kan inte jämföra fler än fyra käpphästar samtidigt!");
        return;
    }

    let added;
    const url = `/api/add-or-remove-compare/${articleNr}`

    // Add or remove the article from the compare list inside a cookie
    await fetch(url, { method: "GET" })
        .then((response) => response.json())
        .then((data) => added = data.added);

    // Check if the article was removed or added, then update the SVG filling accordingly
    if (added === true) {
        svg.classList.add(SVG_COMPARE_FILL_CLASS);
        numberOfCompares++;
    } else {
        svg.classList.remove(SVG_COMPARE_FILL_CLASS);
        numberOfCompares--;
    }

    ShowOrHideCompareButton();
}
async function getCompare() {
    const url = "/api/get-compare";
    const fetchedArticleList = await fetch(url, { method: "GET" });
    try {
        const data = await fetchedArticleList.json();
        const articleList = data.compareData;
        numberOfCompares = articleList.length;

        for (let index = 0; index < articleList.length; index++) {
            const svg = document.querySelector("#svg-" + articleList[index]);
            if (svg != null) {
                svg.classList.add(SVG_COMPARE_FILL_CLASS);
            }
        }
    } catch (error) {
        numberOfCompares = 0;
    }

    ShowOrHideCompareButton();
}

let isShown = true;

function showHideFilter() {
    const FILTER_CLOSE_CLASS = "filter-closed";
    const MAIN_DIV_CLOSED = "main-div-closed";

    const listItems = filterElement.children;

    for (var i = 1; i < listItems.length; i++) {
        console.log(listItems[i]);
        if (isShown) {
            listItems[i].style.display = "none";
        } else {
            (function (index) {
                setTimeout(() => {
                    listItems[index].style.display = "block";
                }, 300);
            })(i);
        }
    }

    isShown = !isShown;
    filterElement.classList.toggle(FILTER_CLOSE_CLASS);

    if (isShown) {
        hamburgerMenuSVG.style.transform = "";
        mainElement.classList.add(MAIN_DIV_CLOSED);
    }
    else {
        mainElement.classList.remove(MAIN_DIV_CLOSED);
        hamburgerMenuSVG.style.transform = "rotate(0)"
    }

}

window.onbeforeunload = function (e) {
    getCompare();
    getHearts();
};

async function removeCompare() {
    url = `/api/remove-all-comparisons`;
    await fetch(url, { method: "DELETE" });
    var articles = document.querySelectorAll(".compare-svg");
    articles.forEach((svg) => (svg.classList.remove(SVG_COMPARE_FILL_CLASS)));

    numberOfCompares = 0;
    ShowOrHideCompareButton();
}

function ShowOrHideCompareButton() {
    var button = document.getElementById("compare-btn");
    console.log(numberOfCompares);

    if (numberOfCompares < 2) {
        button.style.display = "none";
    } else {
        button.style.display = "";
    }
}

async function addHeart(svg, artikelNr) {
    let didAddHeart;
    const url = `/api/add-or-remove-favourite/${artikelNr}`

    await fetch(url, { method: "GET" })
        .then((o) => o.json())
        .then((o) => (didAddHeart = o.added));
    console.log(didAddHeart);

    if (didAddHeart === true) {
        svg.classList.add(HEART_FILL_CLASS);
    } else {
        svg.classList.remove(HEART_FILL_CLASS);
    }
}

async function getHearts() {
    const fetchedArticleNumbers = await fetch(`/api/favourites`);

    try {
        articleNumbers = await fetchedArticleNumbers.json();
        console.log(articleNumbers);
        for (let index = 0; index < articleNumbers.length; index++) {
            const svg = document.querySelector("#svg2-" + articleNumbers[index]);
            if (svg != null) {
                svg.classList.add(HEART_FILL_CLASS);
            }
        }

    } catch (error) { }
}

/////// Script starts here ///////

getPartialView();

// Closes the filter sidebar if the site is opened on a screen smaller than 700px.
const windowWidth = window.innerWidth;
console.log(windowWidth);
if (windowWidth < 700)
    showHideFilter();