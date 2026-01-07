window.addEventListener("load", initialize);

let data;
const nVerbindungen = 20;
let station;

function initialize() {
    station = JSON.parse(localStorage.getItem("defaultStation")) || "Kriens Mattenhof";
    document.getElementById("station").placeholder = station;

    document.getElementById("search-btn").addEventListener("click", refrechAbfahrten);
    document.getElementById("location-btn").addEventListener("click", refrechAbfahrtenFromGeolocation);
    document.getElementById("station").addEventListener("keydown", (e) => { if (e.key === "Enter") refrechAbfahrten(); });
    document.getElementById("set-default-btn").addEventListener("click", function () {
        const defaultStation = document.getElementById("station").value;
        localStorage.setItem("defaultStation", JSON.stringify(defaultStation));
    });

    refrechAbfahrten();

    const updateAbfahrten = setInterval(async () => {
        await holeNächsteAbfahrten(document.getElementById("station-name").textContent);
        loadConections();
    }, 10000);
}

async function refrechAbfahrten() {
    station = document.getElementById("station").value || station;
    await holeNächsteAbfahrten(station);
    loadConections();
}

const hhmm = s => s.slice(11, 16);

function loadConections() {
    const abfahrtstafel = document.getElementById("departures-body");
    abfahrtstafel.innerHTML = "";

    const limit = Math.min(data.stationboard.length, nVerbindungen);

    for (let i = 0; i < limit; i++) {
        const row = document.createElement("tr");
        const time = document.createElement("td");
        time.setAttribute("class", "time");
        const number = document.createElement("td");
        number.setAttribute("class", "number");
        const destination = document.createElement("td");
        destination.setAttribute("class", "destination");
        const platform = document.createElement("td");
        platform.setAttribute("class", "track");

        if (data.stationboard[i].stop.delay > 0) {
            time.textContent = hhmm(data.stationboard[i].stop.departure) + " + " + data.stationboard[i].stop.delay;
            time.classList.add("alert");
        } else {
            time.textContent = hhmm(data.stationboard[i].stop.departure);
        }

        number.textContent = data.stationboard[i].category + " " + data.stationboard[i].number;
        destination.textContent = data.stationboard[i].to

        platform.textContent = data.stationboard[i].stop.platform || "-";

        if (String(data.stationboard[i].stop.platform).includes("!")) {
            platform.classList.add("alert");
        }

        row.innerHTML = `${time.outerHTML}${number.outerHTML}${destination.outerHTML}${platform.outerHTML}`;
        abfahrtstafel.appendChild(row);

        document.getElementById("station-name").textContent = data.station.name;
    }
}

async function holeNächsteAbfahrten(station = "Kriens Mattenhof") {
    const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(station)}&limit=${nVerbindungen}`;
    let response = await fetch(url);
    const json = await response.json();

    if (json.station != null) {
        data = json;
    } else {
        alert("Station nicht gefunden");
    }
}

async function refrechAbfahrtenFromGeolocation() {
    await getNearbyStations();
    await holeNächsteAbfahrten(station);
    loadConections();
}

function getNearbyStations() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            alert("Geolocation nicht verfügbar");
            reject("No Geolocation");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log("Latitude:", lat, "Longitude:", lon);

            const url = `https://transport.opendata.ch/v1/locations?x=${lat}&y=${lon}`;
            let response = await fetch(url);
            const json = await response.json();

            if (json.stations && json.stations.length > 0) {
                station = json.stations[1].name;
                document.getElementById("station").value = station;
                resolve();
            } else {
                alert("Keine Station in der Nähe gefunden");
                reject("No stations");
            }
        }, (err) => {
            console.error("Geolocation error:", err.message);
            reject(err);
        });
    });
}