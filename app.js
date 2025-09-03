document.addEventListener("DOMContentLoaded", () => {
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const resetBtn = document.getElementById("resetBtn");
  const playerList = document.getElementById("playerList");
  const form = document.getElementById("setupForm");
  const output = document.getElementById("scheduleOutput");
  const regenerateBtn = document.getElementById("regenerateBtn");

  const maxPlayers = 12;
  let playerCount = 0;

  // Store last valid input to regenerate
  let lastNames = [];
  let lastGames = [];
  let lastNumGames = 0;

  // === Add Player ===
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
      <button type="button" class="delete-player-btn">🗑</button>
    `;

    // Add delete handler
    playerEntry.querySelector(".delete-player-btn").addEventListener("click", () => {
      playerEntry.remove();
      playerCount--;
    });

    playerList.appendChild(playerEntry);
  });

  // === Reset Form ===
  resetBtn.addEventListener("click", () => {
    form.reset();
    playerList.innerHTML = "";
    output.innerHTML = "";
    playerCount = 0;
    regenerateBtn.style.display = "none";
    lastNames = [];
    lastGames = [];
    lastNumGames = 0;
  });

  // === Submit Form ===
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const numGames = parseInt(document.getElementById("numGames").value);
    const nameInputs = [...document.querySelectorAll(".player-name")];
    const gameInputs = [...document.querySelectorAll(".player-games")];

    const names = nameInputs.map(input => input.value.trim()).filter(Boolean);
    const games = gameInputs.map(input => parseInt(input.value));

    const totalSlots = numGames * 4;
    const assignedSlots = games.reduce((sum, val) => sum + val, 0);

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
      alert(`Total assigned games (${assignedSlots}) must equal total slots (${totalSlots}).`);
      return;
    }

    // Save for regeneration
    lastNames = [...names];
    lastGames = [...games];
    lastNumGames = numGames;

    // Preview players
    let preview = "<h3>📝 Player Summary</h3><ul>";
    names.forEach((name, i) => {
      preview += `<li>${name}: ${games[i]} game${games[i] !== 1 ? "s" : ""}</li>`;
    });
    preview += "</ul><p>⏳ Generating schedule...</p>";
    output.innerHTML = preview;

    setTimeout(() => {
      const schedule = generateSmartSchedule(names, games, numGames);
      displaySchedule(schedule, numGames);
    }, 400);
  });

  // === Regenerate ===
  regenerateBtn.addEventListener("click", () => {
    if (lastNames.length && lastGames.length && lastNumGames) {
      const schedule = generateSmartSchedule(lastNames, lastGames, lastNumGames);
      displaySchedule(schedule, lastNumGames);
    }
  });

  // === Smart Schedule Generator ===
  function generateSmartSchedule(names, games, numGames) {
    let players = names.map((name, i) => ({
      name,
      remaining: games[i],
      playedWith: new Set(),
    }));

    const schedule = [];

    for (let g = 1; g <= numGames; g++) {
      const available = players.filter(p => p.remaining > 0);
      if (available.length < 4) break;

      available.sort((a, b) => b.remaining - a.remaining || a.playedWith.size - b.playedWith.size);

      let group = [];
      for (let i = 0; i < available.length && group.length < 4; i++) {
        const candidate = available[i];
        if (group.every(p => !p.playedWith.has(candidate.name))) {
          group.push(candidate);
        }
      }

      if (group.length < 4) {
        group = available.slice(0, 4);
      }

      group.forEach(p => {
        p.remaining--;
        group.forEach(other => {
          if (p !== other) p.playedWith.add(other.name);
        });
      });

      const team1 = [group[0].name, group[1].name];
      const team2 = [group[2].name, group[3].name];
      schedule.push({ game: g, team1, team2 });
    }

    return schedule;
  }

  // === Display Output ===
  function displaySchedule(schedule, expectedGames) {
    let html = "";

    output.innerHTML = "";

    if (schedule.length === 0) {
      output.innerHTML = `
        <div class="no-schedule">
          <p>❌ No valid schedule could be generated. Please check player assignments.</p>
        </div>
      `;
      regenerateBtn.style.display = "none";
      return;
    }

    if (schedule.length < expectedGames) {
      html += `<p>⚠️ Only ${schedule.length} out of ${expectedGames} games could be created. Adjust player assignments or balance more evenly.</p>`;
    }

    html += `
      <h3>✅ Generated Schedule</h3>
      <ol>
        ${schedule.map(match =>
          `<li>Game ${match.game}: <strong>${match.team1.join(" & ")}</strong> vs <strong>${match.team2.join(" & ")}</strong></li>`
        ).join("")}
      </ol>
    `;

    output.innerHTML = html;
    regenerateBtn.style.display = "inline-block";
  }
});
