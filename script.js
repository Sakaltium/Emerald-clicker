let emeralds = 0;
let fortune = 0;
let stats = { clicks: 0, produced: 0, rebirths: 0 };
let facilityCounts = Array(15).fill(0);
let facilityFortunes = Array(15).fill(0);
let rebirthBonus = 1;
let fever = false;
let feverTimer = 0;
let lastFortuneTime = Date.now();
let achievements = [];
let achieved = {};

const facilityData = [
  { name: "鉱夫", baseCost: 10, production: 0.1 },
  { name: "採掘ドローン", baseCost: 100, production: 1 },
  { name: "エメラルド精製所", baseCost: 1100, production: 8 },
  { name: "ナノマシン工場", baseCost: 12000, production: 50 },
  { name: "地下帝国", baseCost: 130000, production: 300 },
  { name: "エメラルド星", baseCost: 1_700_000, production: 1675 },
  { name: "多次元鉱脈", baseCost: 24_000_000, production: 10000 },
  { name: "時空採掘場", baseCost: 195_000_000, production: 90000 },
  { name: "AI支配採掘機", baseCost: 4_000_000_000, production: 480000 },
  { name: "ダークマター生成装置", baseCost: 90_000_000_000, production: 5200000 },
  { name: "宇宙改変施設", baseCost: 1_100_000_000_000, production: 21000000 },
  { name: "異世界ゲート", baseCost: 121_000_000_000_000, production: 345000000 },
  { name: "虚無の抽出機", baseCost: 15_103_000_000_000_000, production: 4920000000 },
  { name: "神話鉱床", baseCost: 145_100_000_000_000_000, production: 234100000000 },
  { name: "超次元コア", baseCost: 1.02e23, production: 1563500000000 }
];

const formatLong = [' K', ' M', ' B', ' T', ' Qa', ' Qi', ' Sx', ' Sp', ' Oc', ' No'];
const prefixes = ['', 'un', 'duo', 'tre', 'quattuor', 'quin', 'sex', 'septen', 'octo', 'novem'];
const suffixes = ['dec', 'vigint', 'trigint', 'quadragint', 'quinquagint', 'sexagint', 'septuagint', 'octogint', 'nonagint'];

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
  if (emeralds < 1e6) {
    alert("転生には最低100万エメラルド必要です。");
    return;
  }
  const bonus = Math.floor(emeralds / 1e6) * 0.25;
  rebirthBonus += bonus;
  stats.rebirths++;
  emeralds = 0;
  facilityCounts.fill(0);
  facilityFortunes.fill(0);
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
  let prod = 0;
  facilityData.forEach((fac, i) => {
    const multiplier = Math.pow(1.5, facilityFortunes[i]);
    prod += fac.production * multiplier * facilityCounts[i] * Math.pow(1.15, facilityCounts[i]);
  });
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
  document.getElementById("emeralds").innerText = formatNumber(emeralds);
  document.getElementById("fortune").innerText = fortune;
  document.getElementById("stats").innerHTML =
    `クリック数: ${formatNumber(stats.clicks)}<br>` +
    `累計生産量: ${formatNumber(stats.produced)}<br>` +
    `転生回数: ${stats.rebirths}<br>` +
    `転生ボーナス: x${rebirthBonus.toFixed(2)}`;
}

function renderFacilities() {
  const container = document.getElementById("facilities");
  container.innerHTML = "";
  facilityData.forEach((fac, i) => {
    const cost = Math.floor(fac.baseCost * Math.pow(1.15, facilityCounts[i]));
    const multiplier = Math.pow(1.5, facilityFortunes[i]);
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      ${fac.name}<br>
      所有: ${facilityCounts[i]}<br>
      コスト: ${formatNumber(cost)}<br>
      生産量: ${formatNumber(fac.production * multiplier * Math.pow(1.15, facilityCounts[i]))} /秒<br>
      占い強化: ${facilityFortunes[i]}回<br>
      <button class="neon-btn" style="font-size:0.8em;" id="fortune_${i}">占い強化</button>
    `;
    container.appendChild(div);
    document.getElementById(`fortune_${i}`).onclick = () => {
      if (fortune > 0) {
        fortune--;
        facilityFortunes[i]++;
        render();
      }
    };
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
    emeralds, fortune, stats, facilityCounts, facilityFortunes, rebirthBonus, lastFortuneTime, achieved
  }));
}

function load() {
  const data = JSON.parse(localStorage.getItem("save"));
  if (data) {
    emeralds = data.emeralds;
    fortune = data.fortune;
    stats = data.stats;
    facilityCounts = data.facilityCounts;
    facilityFortunes = data.facilityFortunes || Array(15).fill(0);
    rebirthBonus = data.rebirthBonus;
    lastFortuneTime = data.lastFortuneTime;
    achieved = data.achieved || {};
  }
}

function formatNumber(num) {
  if (num < 1000) return Math.floor(num);
  let tier = Math.floor(Math.log10(num) / 3);
  if (tier <= 3) {
    return (num / Math.pow(1000, tier)).toFixed(2) + formatLong[tier - 1];
  }
  tier -= 4;
  const prefixIndex = tier % prefixes.length;
  const suffixIndex = Math.floor(tier / prefixes.length);
  return (num / Math.pow(1000, tier + 4)).toFixed(2) +
    prefixes[prefixIndex] + suffixes[suffixIndex] + "illion";
}
