const TICKETS = [
  {
    title: "推荐不够准",
    question: "我的职业资料还不完整，想让系统推荐更贴近我，应该先做什么？",
    solution: "Career Hub → 更新 Skills 和 Skill Interests → 重新查看个性化推荐",
    tip: "资料越完整、更新越及时，系统越能理解你的方向。",
  },
  {
    title: "下一步怎么走",
    question: "我想了解当前岗位之后有哪些发展方向，应该从哪里开始？",
    solution: "Career Hub → Plan → Launch Career Path Builder",
    tip: "Career Path 用于探索可能性，不代表岗位承诺或自动获得机会。",
  },
  {
    title: "想试试新领域",
    question: "我想通过短期项目体验新领域，应该从哪里开始？",
    solution: "Career Hub → Browse Gigs → Express Interest，并给 Gig Host 留言",
    tip: "这里介绍的是操作入口；具体 GIG 机会请前往 Boss 直聘 Booth。",
  },
  {
    title: "直接查看匹配岗位",
    question: "我的职业资料已经准备好，想直接查看当前匹配岗位，应该从哪里进入？",
    solution: "Career Hub → Featured Next Move → 打开岗位信息并进入 Workday 申请流程",
    tip: "具体岗位与 Hiring Manager 请前往 Boss 直聘 Booth。",
  },
  {
    title: "有合适岗位，提醒我",
    question: "我想在出现符合偏好的岗位时收到通知，应该如何设置？",
    solution: "Career Hub → Manage Job Alerts → 设置岗位偏好与提醒条件",
    tip: "定期检查并更新偏好，能让岗位提醒更贴近你的需求。",
  },
];

const LABELS = ["A", "B", "C", "D", "E"];

const screens = {
  quiz: document.getElementById("screen-quiz"),
  success: document.getElementById("screen-success"),
  fail: document.getElementById("screen-fail"),
};

const titleEl = document.getElementById("ticket-title");
const questionEl = document.getElementById("ticket-question");
const choicesEl = document.getElementById("choices");
const successTipEl = document.getElementById("success-tip");

let currentTicket = null;
let locked = false;

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandomTicket() {
  return TICKETS[Math.floor(Math.random() * TICKETS.length)];
}

function startRound() {
  locked = false;
  currentTicket = pickRandomTicket();

  titleEl.textContent = currentTicket.title;
  questionEl.textContent = currentTicket.question;

  const options = shuffle(TICKETS.map((t) => t.solution));
  choicesEl.innerHTML = "";

  options.forEach((text, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    btn.dataset.label = LABELS[index];
    btn.textContent = text;
    btn.addEventListener("click", () => onChoose(btn, text));
    choicesEl.appendChild(btn);
  });

  showScreen("quiz");
}

function onChoose(btn, text) {
  if (locked || !currentTicket) return;
  locked = true;

  const correct = text === currentTicket.solution;
  btn.classList.add(correct ? "correct-flash" : "wrong-flash");

  window.setTimeout(() => {
    if (correct) {
      successTipEl.textContent = currentTicket.tip;
      showScreen("success");
    } else {
      showScreen("fail");
    }
  }, 280);
}

document.getElementById("btn-next").addEventListener("click", startRound);
document.getElementById("btn-retry").addEventListener("click", startRound);

// 小熊挥手帧动画（类似 GIF）
const bearHero = document.getElementById("bear-hero");
if (bearHero) {
  const frames = Array.from(bearHero.querySelectorAll(".bear-frame"));
  // 挥手循环：站立 → 高挥 → 中挥 → 低挥 → 中挥 → 高挥
  const sequence = [0, 1, 2, 3, 2, 1];
  let step = 0;

  window.setInterval(() => {
    frames.forEach((frame) => frame.classList.remove("is-active"));
    const index = sequence[step % sequence.length];
    frames[index].classList.add("is-active");
    step += 1;
  }, 480);
}

// 打开即进入答题
startRound();
