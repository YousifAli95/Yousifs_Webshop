﻿// Price  event listener
fromSlider.addEventListener("change", (event) => {
    minPrice = event.target.value;
    getPartialView();
});

toSlider.addEventListener("change", (event) => {
    maxPrice = event.target.value;
    getPartialView();
});

fromInput.addEventListener("change", (event) => {
    minPrice = event.target.value;
    getPartialView();
});

toInput.addEventListener("change", (event) => {
    maxPrice = event.target.value;
    getPartialView();
});

// Horsepower event listener
fromSliderHK.addEventListener("change", (event) => {
    minHK = event.target.value;
    getPartialView();
});

toSliderHK.addEventListener("change", (event) => {
    maxHK = event.target.value;
    getPartialView();
});

fromInputHK.addEventListener("change", (event) => {
    minHK = event.target.value;
    getPartialView();
});

toInputHK.addEventListener("change", (event) => {
    maxHK = event.target.value;
    getPartialView();
});


function controlFromInput(fromSlider, fromInput, toInput, controlSlider) {
    const [from, to] = getParsed(fromInput, toInput);
    fillSlider(fromInput, toInput, "black", "#7b63ad", controlSlider);
    if (from > to) {
        fromSlider.value = to;
        fromInput.value = to;
    } else {
        fromSlider.value = from;
    }
}

function controlToInput(toSlider, fromInput, toInput, controlSlider) {
    const [from, to] = getParsed(fromInput, toInput);
    fillSlider(fromInput, toInput, "black", "#7b63ad", controlSlider);
    setToggleAccessible(toInput);
    if (from <= to) {
        toSlider.value = to;
        toInput.value = to;
    } else {
        toInput.value = from;
    }
}

function controlFromSlider(fromSlider, toSlider, fromInput) {
    const [from, to] = getParsed(fromSlider, toSlider);
    fillSlider(fromSlider, toSlider, "black", "#7b63ad", toSlider);
    if (from > to) {
        fromSlider.value = to;
        fromInput.value = to;
    } else {
        fromInput.value = from;
    }
}

function controlToSlider(fromSlider, toSlider, toInput) {
    const [from, to] = getParsed(fromSlider, toSlider);
    fillSlider(fromSlider, toSlider, "black", "#7b63ad", toSlider);
    setToggleAccessible(toSlider);
    if (from <= to) {
        toSlider.value = to;
        toInput.value = to;
    } else {
        toInput.value = from;
        toSlider.value = from;
    }
}

function getParsed(currentFrom, currentTo) {
    const from = parseInt(currentFrom.value, 10);
    const to = parseInt(currentTo.value, 10);
    return [from, to];
}

function fillSlider(from, to, sliderColor, rangeColor, controlSlider) {
    const rangeDistance = to.max - to.min;
    const fromPosition = from.value - to.min;
    const toPosition = to.value - to.min;
    controlSlider.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0%,
      ${sliderColor} ${(fromPosition / rangeDistance) * 100}%,
      ${rangeColor} ${(fromPosition / rangeDistance) * 100}%,
      ${rangeColor} ${(toPosition / rangeDistance) * 100}%, 
      ${sliderColor} ${(toPosition / rangeDistance) * 100}%, 
      ${sliderColor} 100%)`;
}

function setToggleAccessible(currentTarget) {
    const toSlider = document.querySelector("#toSlider");
    if (Number(currentTarget.value) <= 0) {
        toSlider.style.zIndex = 2;
    } else {
        toSlider.style.zIndex = 0;
    }
}

fillSlider(fromSlider, toSlider, "black", "#7b63ad", toSlider);
setToggleAccessible(toSlider);

fillSlider(fromSliderHK, toSliderHK, "black", "#7b63ad", toSliderHK);
setToggleAccessible(toSliderHK);

fromSlider.oninput = () => controlFromSlider(fromSlider, toSlider, fromInput);
toSlider.oninput = () => controlToSlider(fromSlider, toSlider, toInput);
fromInput.oninput = () =>
    controlFromInput(fromSlider, fromInput, toInput, toSlider);
toInput.oninput = () => controlToInput(toSlider, fromInput, toInput, toSlider);

fromSliderHK.oninput = () =>
    controlFromSlider(fromSliderHK, toSliderHK, fromInputHK);
toSliderHK.oninput = () => controlToSlider(fromSliderHK, toSliderHK, toInputHK);
fromInputHK.oninput = () =>
    controlFromInput(fromSliderHK, fromInputHK, toInputHK, toSliderHK);
toInputHK.oninput = () =>
    controlToInput(toSliderHK, fromInputHK, toInputHK, toSliderHK);