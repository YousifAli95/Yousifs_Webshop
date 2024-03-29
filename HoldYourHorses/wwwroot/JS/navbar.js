﻿const searchInputs = document.getElementsByClassName("search-input");
const initialSearchValue = document.getElementById("hidden-search-input")?.value;
let searchString = initialSearchValue ?? "";


Array.from(searchInputs).forEach(input => {
    // Sets the the intial value of the input
    input.value = searchString;

    // Sync all the search input fields with each other so that they have the same value
    input.addEventListener("input", (event) => {
        searchString = event.target.value;
        Array.from(searchInputs).forEach(input => input.value = searchString);
    })

    //Add "Enter" eventListener so you can press the search button by pressing the enter key
    input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("search-btn").click();
        }
    });

})

function searchFunction() {
    window.location.href = `/?search=${searchString}`;
}

function fetchDatalist() {
    const url = "/api/articles";
    const datalistId = "article-choice";
    const datalistElement = document.getElementById(datalistId);
    fetch(url, { method: "GET" })
        .then(response => response.json())
        .then(optionArray => {
            // OptionArray is an array of article titles as strings
            optionArray.forEach(articleTitle => {
                const optionElement = document.createElement("option");
                optionElement.value = articleTitle; // Set the option's value to the article title
                datalistElement.appendChild(optionElement);
            });
        })
        .catch(error => {
            console.error("Error fetching articles:", error);
        });
}

fetchDatalist();