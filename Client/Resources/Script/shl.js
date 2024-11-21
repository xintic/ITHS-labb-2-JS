const API_URL = "http://localhost:5501";

// Hanterar Light och Dark mode
const toggleMode = () => {
  const body = document.body;
  const newTheme = body.dataset.bsTheme === "dark" ? "light" : "dark";
  body.dataset.bsTheme = newTheme;
  localStorage.setItem("theme", newTheme);
  updateIcon(newTheme);
};

const updateIcon = (theme) => {
  const themeIcon = document.getElementById("themeIcon");
  themeIcon.className =
    theme === "dark" ? "bi bi-moon-stars-fill" : "bi bi-sun-fill";
};

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.dataset.bsTheme = savedTheme;
  document.getElementById("flexSwitchCheckChecked").checked =
    savedTheme === "dark";
  updateIcon(savedTheme);
});

// Login Form
document
  .getElementById("login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("user-email").value;
    const password = document.getElementById("user-password").value;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        document.getElementById("login-form-button").innerText = "Inloggad!";
        window.location.reload();
      } else {
        document.getElementById("error-msg").innerText = "Fel vid inloggning";
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Växlar logga in-texten om användaren är inloggad eller inte
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  const loginText = loginButton.querySelector(".nav-link");

  if (localStorage.getItem("accessToken")) {
    loginText.innerHTML = 'Mina sidor <i class="bi bi-person-fill-gear"></i>';
    loginButton.onclick = () => (window.location.href = "/client/account.html");
  }
});

// Fetching API via proxy.js

// Visar tabellen, team.competitor.name används i desktop och team.competitor.abbreviation i mobil
(async () => {
  try {
    const response = await fetch(`${API_URL}/api/standings/shl`);
    const data = await response.json();

    const tableBody = document
      .getElementById("table-standings")
      .getElementsByTagName("tbody")[0];
    const standingsGroups = data.standings[0].groups[0].standings;

    standingsGroups.forEach((team) => {
      const standingsRow = document.createElement("tr");

      const standingsCol = document.createElement("td");
      standingsCol.style.fontWeight = "700";
      standingsCol.textContent = team.rank;
      standingsRow.appendChild(standingsCol);

      const nameCol = document.createElement("td");
      const teamLogo = document.createElement("img");
      teamLogo.src = `Resources/Images/SHL/${team.competitor.abbreviation}.svg`;
      teamLogo.alt = `${team.competitor.name}`;
      teamLogo.className = "team-logo";
      nameCol.appendChild(teamLogo);

      const teamName = document.createElement("span");
      teamName.textContent = team.competitor.name;
      teamName.className = "team-name";

      const teamAbbreviation = document.createElement("span");
      teamAbbreviation.textContent = team.competitor.abbreviation;
      teamAbbreviation.className = "team-abbreviation";

      nameCol.appendChild(teamName);
      nameCol.appendChild(teamAbbreviation);
      standingsRow.appendChild(nameCol);

      const gpCol = document.createElement("td");
      gpCol.className = "center";
      gpCol.textContent = team.played;
      standingsRow.appendChild(gpCol);

      const wCol = document.createElement("td");
      wCol.className = "center";
      wCol.textContent = team.win;
      standingsRow.appendChild(wCol);

      const lCol = document.createElement("td");
      lCol.className = "center";
      lCol.textContent = team.loss;
      standingsRow.appendChild(lCol);

      const gfCol = document.createElement("td");
      gfCol.className = "center";
      gfCol.textContent = team.goals_for;
      standingsRow.appendChild(gfCol);

      const gaCol = document.createElement("td");
      gaCol.className = "center";
      gaCol.textContent = team.goals_against;
      standingsRow.appendChild(gaCol);

      const gdCol = document.createElement("td");
      gdCol.className = "center";
      gdCol.textContent = team.goals_diff;
      standingsRow.appendChild(gdCol);

      const ptsCol = document.createElement("td");
      ptsCol.className = "center";
      ptsCol.textContent = team.points;
      standingsRow.appendChild(ptsCol);

      tableBody.appendChild(standingsRow);
    });
  } catch (error) {
    console.error("Error:", error);
  }
})();

// Funktion för sorterting av kolumner i tabellen
const sortDirections = {};

function sortTable(columnIndex) {
  const tableBody = document
    .getElementById("table-standings")
    .getElementsByTagName("tbody")[0];
  const rows = Array.from(tableBody.rows);

  sortDirections[columnIndex] = !sortDirections[columnIndex];
  const ascending = sortDirections[columnIndex];

  rows.sort((a, b) => {
    const cellA = a.cells[columnIndex].textContent.trim();
    const cellB = b.cells[columnIndex].textContent.trim();

    const valueA = isNaN(cellA) ? cellA : Number(cellA);
    const valueB = isNaN(cellB) ? cellB : Number(cellB);

    if (valueA < valueB) return ascending ? -1 : 1;
    if (valueA > valueB) return ascending ? 1 : -1;
    return 0;
  });

  rows.forEach((row) => tableBody.appendChild(row));
}

// Itererar ut varje omgång i separat array för lättare hantering
let roundsArray = [];
let currentRoundIndex = 0;

const fetchAndProcessRounds = async () => {
  try {
    const response = await fetch(`${API_URL}/api/summaries/shl`);
    const data = await response.json();

    data.summaries.forEach((event) => {
      const roundNumber = event.sport_event.sport_event_context.round.number;
      let round = roundsArray.find((r) => r.round === roundNumber);
      if (!round) {
        round = { round: roundNumber, matches: [] };
        roundsArray.push(round);
      }
      round.matches.push(event);
    });
    roundsArray.sort((a, b) => a.round - b.round);
    renderRound(currentRoundIndex);
  } catch (error) {
    console.error("Error", error);
  }
};

// Itererar genom arrayerna som skapades innan
const renderRound = (roundIndex) => {
  const gamesDiv = document.getElementById("games");
  gamesDiv.innerHTML = "";

  const round = roundsArray[roundIndex];
  if (!round) return;

  const headerContainer = document.createElement("div");
  headerContainer.className = "header-container";

  const prevButton = document.createElement("button");
  prevButton.innerHTML = '<i class="bi bi-chevron-double-left"></i>';
  prevButton.classList.add("btn", "btn-secondary", "nav-button");
  prevButton.onclick = prevRound;
  prevButton.disabled = roundIndex === 0;

  const roundHeader = document.createElement("h2");
  roundHeader.textContent = `Omgång ${round.round}`;

  const nextButton = document.createElement("button");
  nextButton.innerHTML = '<i class="bi bi-chevron-double-right"></i>';
  nextButton.onclick = nextRound;
  nextButton.disabled = roundIndex === roundsArray.length - 1;
  nextButton.classList.add("btn", "btn-secondary", "nav-button");

  headerContainer.appendChild(prevButton);
  headerContainer.appendChild(roundHeader);
  headerContainer.appendChild(nextButton);
  gamesDiv.appendChild(headerContainer);

  round.matches.forEach((match) => {
    const matchDiv = document.createElement("div");
    matchDiv.className = "match";

    const homeScore = match.sport_event_status.home_score;
    const awayScore = match.sport_event_status.away_score;
    const startTime = new Date(match.sport_event.start_time);

    const formattedDate = startTime.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formattedTime = startTime.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const homeDiv = document.createElement("div");
    homeDiv.className = "team home";

    const homeInfoDiv = document.createElement("div");
    homeInfoDiv.className = "competitor-info";

    const homeLogo = document.createElement("img");
    homeLogo.src = `Resources/Images/SHL/${match.sport_event.competitors[0].abbreviation}.svg`;
    homeLogo.alt = `${match.sport_event.competitors[0].name}`;
    homeLogo.className = "competitor-logo";

    const homeNameDiv = document.createElement("div");
    homeNameDiv.className = "competitor-name";
    homeNameDiv.textContent = match.sport_event.competitors[0].name;

    const homeScoreDiv = document.createElement("div");
    homeScoreDiv.className = "competitor-score";
    if (homeScore != null && awayScore != null) {
      homeScoreDiv.textContent = homeScore;
    } else {
      homeScoreDiv.textContent = formattedDate;
      homeScoreDiv.classList.add("upcoming");
    }

    const awayDiv = document.createElement("div");
    awayDiv.className = "team away";

    const awayInfoDiv = document.createElement("div");
    awayInfoDiv.className = "competitor-info";

    const awayLogo = document.createElement("img");
    awayLogo.src = `Resources/Images/SHL/${match.sport_event.competitors[1].abbreviation}.svg`;
    awayLogo.alt = `${match.sport_event.competitors[1].name}`;
    awayLogo.className = "competitor-logo";

    const awayNameDiv = document.createElement("div");
    awayNameDiv.className = "competitor-name";
    awayNameDiv.textContent = match.sport_event.competitors[1].name;

    const awayScoreDiv = document.createElement("div");
    awayScoreDiv.className = "competitor-score";
    if (homeScore != null && awayScore != null) {
      awayScoreDiv.textContent = awayScore;
    } else {
      awayScoreDiv.textContent = formattedTime;
      awayScoreDiv.classList.add("upcoming");
    }

    if (awayScore > homeScore) {
      awayNameDiv.classList.add("winner");
      awayScoreDiv.classList.add("winner");
    } else if (homeScore > awayScore) {
      homeNameDiv.classList.add("winner");
      homeScoreDiv.classList.add("winner");
    }

    homeInfoDiv.appendChild(homeLogo);
    homeInfoDiv.appendChild(homeNameDiv);
    homeDiv.appendChild(homeInfoDiv);
    homeDiv.appendChild(homeScoreDiv);

    awayInfoDiv.appendChild(awayLogo);
    awayInfoDiv.appendChild(awayNameDiv);
    awayDiv.appendChild(awayInfoDiv);
    awayDiv.appendChild(awayScoreDiv);

    matchDiv.appendChild(homeDiv);
    matchDiv.appendChild(awayDiv);
    gamesDiv.appendChild(matchDiv);
  });
};

fetchAndProcessRounds();

// Funktioner för att växla mellan omgångar som används i renderRound
const nextRound = () => {
  if (currentRoundIndex < roundsArray.length - 1) {
    currentRoundIndex++;
    renderRound(currentRoundIndex);
  }
};
const prevRound = () => {
  if (currentRoundIndex > 0) {
    currentRoundIndex--;
    renderRound(currentRoundIndex);
  }
};

// Begränsningar för antal rader i Leaders tabellerna
let rowCounters = {
  points: 10,
  goals: 10,
  assists: 10,
};
const maxRows = 30;

const renderLeaders = (listType, data, rowLimit) => {
  const tbody = document.getElementById(`${listType}Body`);
  tbody.innerHTML = "";

  let rowCounter = 0;

  data.lists
    .find((list) => list.type === listType)
    .leaders.forEach((leader) => {
      leader.players.forEach((player) => {
        if (rowCounter >= rowLimit) return;

        const leadersRow = document.createElement("tr");

        const playerRank = document.createElement("td");
        playerRank.style.fontWeight = "700";
        playerRank.textContent = leader.rank;
        leadersRow.appendChild(playerRank);

        const playerName = document.createElement("td");
        playerName.textContent = player.name;
        leadersRow.appendChild(playerName);

        if (player.competitors && Array.isArray(player.competitors)) {
          player.competitors.forEach((competitor) => {
            const abbrTeam = document.createElement("td");
            abbrTeam.className = "left";
            abbrTeam.textContent = competitor.abbreviation;
            abbrTeam.style.fontWeight = 700;
            leadersRow.appendChild(abbrTeam);

            if (competitor.datapoints && Array.isArray(competitor.datapoints)) {
              const dataPoint = competitor.datapoints.find(
                (dp) => dp.type === listType
              );
              if (dataPoint) {
                const playerValue = document.createElement("td");
                playerValue.className = "right";
                playerValue.textContent = dataPoint.value;
                leadersRow.appendChild(playerValue);
              }
            }
          });
        }

        tbody.appendChild(leadersRow);
        rowCounter++;
      });
    });
};

// Funktion för att hämta in fler rader
const showMoreRows = async (listType, button) => {
  if (rowCounters[listType] < maxRows) {
    rowCounters[listType] = Math.min(rowCounters[listType] + 10, maxRows);

    try {
      const response = await fetch(`${API_URL}/api/leaders/shl`);
      const data = await response.json();

      renderLeaders(listType, data, rowCounters[listType]);

      if (rowCounters[listType] >= maxRows) {
        button.textContent = "Inget mer att visa";
        button.disabled = true;
      }
    } catch (error) {
      console.error("Error fetching more rows:", error);
    }
  }
};

// Funktion för att ladda initiala data vid sidladdning
const loadInitialLeaders = async () => {
  try {
    const response = await fetch(`${API_URL}/api/leaders/shl`);
    const data = await response.json();

    renderLeaders("points", data, rowCounters.points);
    renderLeaders("goals", data, rowCounters.goals);
    renderLeaders("assists", data, rowCounters.assists);
  } catch (error) {
    console.error("Error loading initial leaders:", error);
  }
};

// Kör initiella laddningen av data
loadInitialLeaders();

// Knapp för desktop läge som hämtar alla 3 Leader tabeller
document.getElementById("desktop-show-more").addEventListener("click", () => {
  ["points", "goals", "assists"].forEach((listType) => {
    const button = document.getElementById("desktop-show-more");
    showMoreRows(listType, button);
  });
});

// Knappar för mobil som hämtar för varje separat Leader tabell
document.getElementById("points-show-more").addEventListener("click", () => {
  showMoreRows("points", document.getElementById("points-show-more"));
});
document.getElementById("goals-show-more").addEventListener("click", () => {
  showMoreRows("goals", document.getElementById("goals-show-more"));
});
document.getElementById("assists-show-more").addEventListener("click", () => {
  showMoreRows("assists", document.getElementById("assists-show-more"));
});

// Chart.JS
const renderPlayerCountriesChart = async () => {
  try {
    const response = await fetch(`${API_URL}/api/countries/shl`);
    const data = await response.json();

    const labels = data.countries.map((country) => country.nation);
    const playersData = data.countries.map((country) => country.players);

    const ctx = document.getElementById("playerCountries").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Antal spelare per nation",
            data: playersData,
            backgroundColor: [
              "#36A2EB",
              "#FF6384",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#66FF66",
              "#FF6633",
              "#3399FF",
              "#CC33FF",
              "#FF6699",
              "#33FFCC",
              "#FFCC00",
              "#99FF33",
            ],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "left",
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.label}: ${tooltipItem.raw} spelare`;
              },
            },
          },
        },
        maintainAspectRatio: false,
      },
    });
  } catch (error) {
    console.error("Error fetching player countries data:", error);
  }
};

// Kör funktionen för att rendera grafen
renderPlayerCountriesChart();
