document.addEventListener("DOMContentLoaded", () => {
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const resetBtn = document.getElementById("resetBtn");
  const playerList = document.getElementById("playerList");
  const form = document.getElementById("setupForm");
  const output = document.getElementById("scheduleOutput");

  const maxPlayers = 12;
  let playerCount = 0;

  // Add a new player input row
  addPlayerBtn.addEventListener("click", () => {
    if (playerCount >= maxPlayers) {
      alert(`Maximum of ${maxPlayers} players reached.`);
      return;
    }

    playerCount++;

    const playerEntry = document.createElement("div");
    playerEntry.classList.add("player-entry");
    playerEntry.innerHTML = `
      <input 
        type="text" 
        placeholder="Player ${playerCount}" 
        required 
        class="player-name" 
        maxlength="20"
      >
      <label>
        Games:
        <select class="player-games">
          ${Array.from({ length: 9 }, (_, i) => `<option value="${i}">${i}</option>`).join("")}
        </select>
      </label>
    `;

    playerList.appendChild(playerEntry);
  });

  // Reset form and player list
  resetBtn.addEventListener("click", () => {
    form.reset();
    playerList.innerHTML = "";
    output.innerHTML = "";
    playerCount = 0;
  });

  // Handle schedule generation
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const numGames = parseInt(document.getElementById("numGames").value);
    const nameInputs = [...document.querySelectorAll(".player-name")];
    const gameInputs = [...document.querySelectorAll(".player-games")];

    const names = nameInputs.map(input => input.value.trim()).filter(Boolean);
    const games = gameInputs.map(input => parseInt(input.value));

    const totalSlots = numGames * 4;
    const assignedSlots = games.reduce((sum, val) => sum + val, 0);

    // === VALIDATION ===

    if (names.length < 4) {
      alert("At least 4 players are required to generate a schedule.");
      return;
    }

    if (new Set(names).size !== names.length) {
      alert("Player names must be unique.");
      return;
    }

    if (games.some(g => g === 0)) {
      alert("All players must be assigned at least one game.");
      return;
    }

    if (assignedSlots !== totalSlots) {
      alert(`Total assigned games (${assignedSlots}) must equal total available slots (${totalSlots}).`);
      return;
    }

    // === PREVIEW & LOADING INDICATOR ===

    let preview = "<h3>📝 Player Summary</h3><ul>";
    names.forEach((name, i) => {
      preview += `<li>${name}: ${games[i]} game${games[i] !== 1 ? "s" : ""}</li>`;
    });
    preview += "</ul><p>⏳ Generating schedule...</p>";
    output.innerHTML = preview;

    // === GENERATE AND DISPLAY SCHEDULE ===
    setTimeout(() => {
      const schedule = generateSchedule(names, games, numGames);
      displaySchedule(schedule);
    }, 500); // Simulate loading
  });

  // Generate schedule logic
  function generateSchedule(names, games, numGames) {
    let players = names.map((name, i) => ({
      name,
      remaining: games[i],
    }));

    const schedule = [];

    for (let gameNum = 1; gameNum <= numGames; gameNum++) {
      const availablePlayers = players.filter(p => p.remaining > 0);

      if (availablePlayers.length < 4) {
        break; // Not enough players to form another match
      }

      const selected = [];
      const pool = [...availablePlayers];

      while (selected.length < 4 && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(randomIndex, 1)[0]);
      }

      selected.forEach(player => player.remaining--);

      const team1 = [selected[0].name, selected[1].name];
      const team2 = [selected[2].name, selected[3].name];

      schedule.push({ game: gameNum, team1, team2 });
    }

    return schedule;
  }

  // Display results
  function displaySchedule(schedule) {
    if (schedule.length === 0) {
      output.innerHTML += `
        <div class="no-schedule">
          <p>❌ No valid schedule could be generated. Please check player assignments.</p>
        </div>
      `;
      return;
    }

    let html = `
      <h3>✅ Generated Schedule</h3>
      <ol>
        ${schedule.map(match =>
          `<li>Game ${match.game}: <strong>${match.team1.join(" & ")}</strong> vs <strong>${match.team2.join(" & ")}</strong></li>`
        ).join("")}
      </ol>
    `;

    output.innerHTML += html;
  }
});
