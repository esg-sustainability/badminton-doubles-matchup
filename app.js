document.addEventListener("DOMContentLoaded", () => {
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const playerList = document.getElementById("playerList");
  const form = document.getElementById("setupForm");
  let playerCount = 0;
  const maxPlayers = 12;

  addPlayerBtn.addEventListener("click", () => {
    if (playerCount >= maxPlayers) return;
    playerCount++;
    const div = document.createElement("div");
    div.classList.add("player-entry");
    div.innerHTML = `
      <input type="text" placeholder="Player ${playerCount}" required class="player-name">
      Games: <select class="player-games">
        ${Array.from({length: 9}, (_,i)=>`<option value="${i}">${i}</option>`).join("")}
      </select>
    `;
    playerList.appendChild(div);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const numGames = parseInt(document.getElementById("numGames").value);
    const names = [...document.querySelectorAll(".player-name")].map(el=>el.value.trim()).filter(Boolean);
    const games = [...document.querySelectorAll(".player-games")].map(el=>parseInt(el.value));
    const totalSlots = numGames * 4;
    const sumGames = games.reduce((a,b)=>a+b,0);

    if (sumGames !== totalSlots) {
      alert(`Total assigned games (${sumGames}) must equal total slots (${totalSlots}).`);
      return;
    }

    const schedule = generateSchedule(names, games, numGames);
    displaySchedule(schedule);
  });

  function generateSchedule(names, games, numGames) {
    let players = names.map((name,i)=>({
      name,
      remaining: games[i]
    }));

    let schedule = [];

    for (let g=0; g<numGames; g++) {
      // Pick 4 available players with remaining > 0
      let available = players.filter(p=>p.remaining>0);
      if (available.length < 4) break;

      let selected = [];
      while (selected.length<4 && available.length>0) {
        let idx = Math.floor(Math.random()*available.length);
        selected.push(available[idx]);
        available.splice(idx,1);
      }
      selected.forEach(p=>p.remaining--);

      let team1 = [selected[0].name, selected[1].name];
      let team2 = [selected[2].name, selected[3].name];
      schedule.push({game: g+1, team1, team2});
    }
    return schedule;
  }

  function displaySchedule(schedule) {
    const output = document.getElementById("scheduleOutput");
    if (schedule.length === 0) {
      output.innerHTML = "<p>No valid schedule generated.</p>";
      return;
    }
    let html = "<h3>Generated Schedule</h3><ol>";
    schedule.forEach(match => {
      html += `<li>Game ${match.game}: ${match.team1.join(" & ")} vs ${match.team2.join(" & ")}</li>`;
    });
    html += "</ol>";
    output.innerHTML = html;
  }
});
