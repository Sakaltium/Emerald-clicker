let emeralds = 0;
let fortune = 0;
let stats = { clicks: 0, produced: 0 };
let facilityCounts = Array(15).fill(0);
let rebirthBonus = 1;
let fever = false;
let feverTimer = 0;
let lastFortuneTime = Date.now();
let achievements = [];
let achieved = {};

const facilityNames = [
  "鉱夫", "採掘ドローン", "エメラルド精製所", "ナノマシン工場", "地下帝国",
  "エメラルド星", "多次元鉱脈", "時空採掘場", "AI支配採掘機", "ダークマター生成装置",
  "宇宙改変施設", "異世界ゲート", "虚無の抽出機", "神話鉱床", "超次元コア"
];

const facilityBaseCosts = [
  10, 100, 500, 2000, 10000,
  50000, 200000, 1000000, 5000000, 20000000,
  100000000, 500000000, 2000000000, 10000000000, 50000000000
];

window.onload = () => {
  load();
  renderFacilities();
  fetch("achievements.json")
    .then(res => res.json())
    .then(data => {
      achievements = data;
      renderAchievements();
    });
  setInterval(gameLoop, 1000);
};

document.getElementById("click-btn").onclick = () => {
  emeralds += getClickValue();
  stats.clicks++;
  if (Math.random() < 0.00016) triggerFever();
  render();
};

document.getElementById("rebirth-btn").onclick = () => {
  emeralds = 0;
  facilityCounts.fill(0);
  rebirthBonus += 0.25;
  save();
  render();
};

function getClickValue() {
  return 1 * rebirthBonus;
}

function triggerFever() {
  fever = true;
  feverTimer = 77;
  document.getElementById("fever-banner").classList.remove("hidden");
}

function gameLoop() {
  let prod = facilityCounts.reduce((sum, count, i) => {
    return sum + count * Math.pow(1.15, count) * 0.1;
  }, 0);
  if (fever) prod *= 5;
  prod *= rebirthBonus;
  emeralds += prod;
  stats.produced += prod;

  if (fever) {
    feverTimer--;
    if (feverTimer <= 0) {
      fever = false;
      document.getElementById("fever-banner").classList.add("hidden");
    }
  }

  if (Date.now() - lastFortuneTime > 60000) {
    fortune++;
    lastFortuneTime = Date.now();
  }

  checkAchievements();
  save();
  render();
}

function render() {
  document.getElementById("emeralds").innerText = Math.floor(emeralds);
  document.getElementById("fortune").innerText = fortune;
  document.getElementById("stats").innerHTML =
    `クリック数: ${stats.clicks} <br> 累計生産量: ${Math.floor(stats.produced)} <br> 転生ボーナス: x${rebirthBonus.toFixed(2)}`;
}

function renderFacilities() {
  const container = document.getElementById("facilities");
  container.innerHTML = "";
  facilityNames.forEach((name, i) => {
    const cost = Math.floor(facilityBaseCosts[i] * Math.pow(1.15, facilityCounts[i]));
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `${name}<br>所有: ${facilityCounts[i]}<br>コスト: ${cost}`;
    div.onclick = () => {
      if (emeralds >= cost) {
        emeralds -= cost;
        facilityCounts[i]++;
        render();
      }
    };
    container.appendChild(div);
  });
}

function renderAchievements() {
  const container = document.getElementById("achievements");
  container.innerHTML = "";
  achievements.forEach(ach => {
    const div = document.createElement("div");
    div.className = "card";
    div.id = `ach_${ach.id}`;
    div.innerHTML = `<b>${ach.name}</b><br>${ach.desc}`;
    container.appendChild(div);
  });
}

function checkAchievements() {
  achievements.forEach(ach => {
    if (achieved[ach.id]) return;
    let complete = ach.blocks.every(block => {
      const [type, val] = block.split(":");
      const n = parseInt(val);
      if (type === "click") return stats.clicks >= n;
      if (type === "total") return stats.produced >= n;
      if (type.startsWith("facility")) {
        const idx = parseInt(type.replace("facility", ""));
        return facilityCounts[idx] >= n;
      }
      return false;
    });
    if (complete) {
      achieved[ach.id] = true;
      document.getElementById(`ach_${ach.id}`).classList.add("achieved");
    }
  });
}

function save() {
  localStorage.setItem("save", JSON.stringify({
    emeralds, fortune, stats, facilityCounts, rebirthBonus, lastFortuneTime, achieved
  }));
}

function load() {
  const data = JSON.parse(localStorage.getItem("save"));
  if (data) {
    emeralds = data.emeralds;
    fortune = data.fortune;
    stats = data.stats;
    facilityCounts = data.facilityCounts;
    rebirthBonus = data.rebirthBonus;
    lastFortuneTime = data.lastFortuneTime;
    achieved = data.achieved || {};
  }
}
