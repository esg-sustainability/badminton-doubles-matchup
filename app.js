document.addEventListener("DOMContentLoaded", () => {
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const resetBtn = document.getElementById("resetBtn");
  const regenerateBtn = document.getElementById("regenerateBtn");
  const playerList = document.getElementById("playerList");
  const form = document.getElementById("setupForm");
  const output = document.getElementById("scheduleOutput");

  const maxPlayers = 12;
  let playerCount = 0;

  let lastNames = [];
  let lastGames = [];
  let lastNumGames = 0;

  // Add Player
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

    playerEntry.querySelector(".delete-player-btn").addEventListener("click", () => {
      playerEntry.remove();
      playerCount--;
      updatePlayerPlaceholders();
    });

    playerList.appendChild(playerEntry);
  });

  // Update placeholders after deleting players
  function updatePlayerPlaceholders() {
    const nameInputs = playerList.querySelectorAll(".player-name");
    nameInputs.forEach((input, idx) => {
      input.placeholder = `Player ${idx + 1}`;
    });
  }

  // Reset Button
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

  // Submit Button (Generate Schedule)
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

    lastNames = [...names];
    lastGames = [...games];
    lastNumGames = numGames;

    output.innerHTML = "<p>⏳ Generating schedule...</p>";
    setTimeout(() => {
      const schedule = generateSmartSchedule(names, games, numGames);
      displaySchedule(schedule, numGames);
    }, 100);
  });

  // Regenerate Button
  regenerateBtn.addEventListener("click", () => {
    if (lastNames.length && lastGames.length && lastNumGames) {
      output.innerHTML = "<p>🔄 Regenerating schedule...</p>";
      setTimeout(() => {
        const schedule = generateSmartSchedule([...lastNames], [...lastGames], lastNumGames);
        displaySchedule(schedule, lastNumGames);
      }, 100);
    }
  });

  // Schedule Generator (Smarter)
  function generateSmartSchedule(names, games, numGames) {
    let players = names.map((name, i) => ({
      name,
      remaining: games[i],
      playedWith: new Set(),
    }));

    const schedule = [];

    for (let g = 1; g <= numGames; g++) {
      // Filter available players with remaining games
      let available = players.filter(p => p.remaining > 0);

      if (available.length < 4) break; // Not enough players to form a game

      // Shuffle available players
      available = shuffleArray(available);

      // Find a group of 4 that have minimal repeats
      let group = null;

      // Try to find group with minimal overlap on teammates
      for (let start = 0; start <= available.length - 4; start++) {
        const candidate = available.slice(start, start + 4);
        if (canFormGroup(candidate)) {
          group = candidate;
          break;
        }
      }

      // If no such group, just pick first 4 shuffled players
      if (!group) {
        group = available.slice(0, 4);
      }

      // Assign games and update playedWith sets
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

  // Helper to check if group is valid (minimal repeats)
  function canFormGroup(group) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].playedWith.has(group[j].name)) {
          return false;
        }
      }
    }
    return true;
  }

  // Shuffle array helper
  function shuffleArray(arr) {
    let array = [...arr];
    for (let i = array.length -1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Display Schedule
  function displaySchedule(schedule, expectedGames) {
    let html = "";
    output.innerHTML = "";

    if (schedule.length === 0) {
      output.innerHTML = "<p>❌ No valid schedule could be generated.</p>";
      regenerateBtn.style.display = "none";
      return;
    }

    if (schedule.length < expectedGames) {
      html += `<p>⚠️ Only ${schedule.length} out of ${expectedGames} games generated.</p>`;
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
