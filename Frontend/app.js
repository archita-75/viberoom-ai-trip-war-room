const API_BASE = "http://localhost:8080/api";
let currentUser = JSON.parse(localStorage.getItem("warRoomUser")) || null;
let currentTrip = null;
let authMode = "login";
let chatInterval = null;

window.onload = () => {
  if (currentUser) {
    showLobby();
  } else {
    showAuth();
  }
};

function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById("authError").classList.add("hidden");
  if (mode === "register") {
    document.getElementById("nameField").classList.remove("hidden");
    document.getElementById("tabRegister").className =
      "py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow";
    document.getElementById("tabLogin").className =
      "py-2.5 text-xs font-extrabold rounded-xl text-zinc-400 hover:text-white transition";
    document.getElementById("authSubmitBtn").innerText =
      "Create Account & Enter →";
  } else {
    document.getElementById("nameField").classList.add("hidden");
    document.getElementById("tabLogin").className =
      "py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow";
    document.getElementById("tabRegister").className =
      "py-2.5 text-xs font-extrabold rounded-xl text-zinc-400 hover:text-white transition";
    document.getElementById("authSubmitBtn").innerText = "Enter Workspace →";
  }
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const name = document.getElementById("authName").value.trim();
  const errEl = document.getElementById("authError");
  errEl.classList.add("hidden");

  const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
  const body =
    authMode === "register" ? { name, email, password } : { email, password };

  try {
    const res = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.innerText = data.error || "Authentication failed";
      errEl.classList.remove("hidden");
      return;
    }
    currentUser = data.user ? data.user : data;
    localStorage.setItem("warRoomUser", JSON.stringify(currentUser));
    showLobby();
  } catch (err) {
    errEl.innerText = "Backend server (localhost:8080) is not running!";
    errEl.classList.remove("hidden");
  }
}

function logoutUser() {
  localStorage.removeItem("warRoomUser");
  currentUser = null;
  if (chatInterval) clearInterval(chatInterval);
  showAuth();
}

function showAuth() {
  document.getElementById("authSection").classList.remove("hidden");
  document.getElementById("lobbySection").classList.add("hidden");
  document.getElementById("roomSection").classList.add("hidden");
  document.getElementById("currentUserBadge").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
}

function showLobby() {
  if (chatInterval) clearInterval(chatInterval);
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("lobbySection").classList.remove("hidden");
  document.getElementById("roomSection").classList.add("hidden");

  const badge = document.getElementById("currentUserBadge");
  badge.innerText = `✨ ${currentUser.name}`;
  badge.classList.remove("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");

  loadMyTrips();
}

async function loadMyTrips() {
  try {
    const res = await fetch(`${API_BASE}/trips/user/${currentUser.id}`);
    const trips = await res.json();
    const container = document.getElementById("myTripsList");

    if (!Array.isArray(trips) || !trips.length) {
      container.innerHTML = `<p class="text-sm text-zinc-500">No rooms created yet. Launch one on the left!</p>`;
      return;
    }

    container.innerHTML = trips
      .map(
        (t) => `
      <div onclick='openRoom(${JSON.stringify(t)})' class="glass-card p-4 rounded-2xl cursor-pointer flex items-center justify-between">
        <div>
          <h4 class="font-display font-bold text-base text-white">${t.title}</h4>
          <p class="text-xs text-zinc-400 mt-0.5">📍 ${t.destination} • Budget: <span class="text-emerald-400 font-bold">₹${t.totalBudget}</span></p>
        </div>
        <span class="px-3 py-1.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 font-mono text-xs font-extrabold">${t.inviteCode}</span>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    console.error(err);
  }
}

async function handleCreateTrip(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById("tripTitle").value,
    destination: document.getElementById("tripDest").value,
    startDate: document.getElementById("tripStart").value,
    endDate: document.getElementById("tripEnd").value,
    totalBudget: parseFloat(document.getElementById("tripBudget").value),
  };

  const res = await fetch(`${API_BASE}/trips/create/${currentUser.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const created = await res.json();
  openRoom(created);
}

async function handleJoinTrip() {
  const code = document.getElementById("joinCodeInput").value.trim();
  if (!code) return;
  const res = await fetch(
    `${API_BASE}/trips/join/${code}/user/${currentUser.id}`,
    { method: "POST" },
  );
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Invalid invite code");
    return;
  }
  openRoom(data.trip || data);
}

function openRoom(trip) {
  currentTrip = trip;
  document.getElementById("lobbySection").classList.add("hidden");
  document.getElementById("roomSection").classList.remove("hidden");

  document.getElementById("roomTitle").innerText = trip.title;
  document.getElementById("roomInviteBadge").innerText = trip.inviteCode;
  document.getElementById("roomMeta").innerText =
    `📍 ${trip.destination} • 📅 ${trip.startDate} to ${trip.endDate} • 💰 Budget: ₹${trip.totalBudget}`;

  refreshRoomData();
  if (chatInterval) clearInterval(chatInterval);
  chatInterval = setInterval(loadChatMessages, 3000);
}

function backToLobby() {
  showLobby();
}

function refreshRoomData() {
  loadMembers();
  loadItinerary();
  loadExpenses();
  loadChatMessages();
}

async function loadMembers() {
  try {
    const res = await fetch(`${API_BASE}/trips/${currentTrip.id}/members`);
    const members = await res.json();
    if (!Array.isArray(members)) return;
    document.getElementById("membersAvatars").innerHTML = members
      .map(
        (m) => `
      <div title="${m.user.name} (${m.role})" class="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-violet-600 text-white border-2 border-zinc-950 flex items-center justify-center text-xs font-extrabold shadow">
        ${m.user.name.charAt(0).toUpperCase()}
      </div>
    `,
      )
      .join("");
  } catch (err) {
    console.error(err);
  }
}

async function triggerAiPlanner() {
  const btn = document.getElementById("aiBtn");
  btn.innerText = "✨ AI Curating...";
  btn.disabled = true;
  await fetch(
    `${API_BASE}/ai/generate/${currentTrip.id}/user/${currentUser.id}`,
    { method: "POST" },
  );
  btn.innerText = "✨ Generate AI Itinerary";
  btn.disabled = false;
  loadItinerary();
}

async function handleAddItem(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById("itemTitle").value,
    category: document.getElementById("itemCategory").value,
    estimatedCost: parseFloat(document.getElementById("itemCost").value),
    dayTag: "Flexible",
    notes: "Suggested by squad member",
  };
  await fetch(
    `${API_BASE}/itinerary/trip/${currentTrip.id}/user/${currentUser.id}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  document.getElementById("itemTitle").value = "";
  document.getElementById("itemCost").value = "";
  loadItinerary();
}

async function loadItinerary() {
  try {
    const res = await fetch(`${API_BASE}/itinerary/trip/${currentTrip.id}`);
    const items = await res.json();
    const box = document.getElementById("itineraryList");

    if (!Array.isArray(items) || !items.length) {
      box.innerHTML = `<div class="glass rounded-3xl p-8 border-dashed border-white/15 text-center text-sm text-zinc-400">No stays or activities yet. Smash <b class="text-fuchsia-400">✨ Generate AI Itinerary</b> above!</div>`;
      return;
    }

    box.innerHTML = items
      .map(
        (item) => `
      <div class="glass-card p-4 rounded-2xl ${item.status === "FINALIZED" ? "border-emerald-500/50 bg-emerald-950/20" : ""} flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-200">${item.category}</span>
            ${item.status === "FINALIZED" ? '<span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ LOCKED IN</span>' : ""}
            <span class="text-[11px] text-zinc-500">by ${item.suggestedBy ? item.suggestedBy.name : "AI"}</span>
          </div>
          <h4 class="font-display font-bold text-white text-base">${item.title}</h4>
          <p class="text-xs text-zinc-400 mt-1">Est: <b class="text-emerald-400">₹${item.estimatedCost || 0}</b> ${item.notes ? "• " + item.notes : ""}</p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="upvoteItem(${item.id})" class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 font-extrabold text-xs border border-rose-500/30 transition">
            ▲ ${item.upvotes}
          </button>
          <button onclick="downvoteItem(${item.id})" class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-bold transition">▼</button>
         ${
           item.status !== "FINALIZED"
             ? `<button onclick="finalizeItem(${item.id})" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 text-xs font-bold transition">Lock</button>`
             : `<button onclick="unlockItem(${item.id})" class="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition">Unlock</button>`
         }
        </div>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    console.error(err);
  }
}

async function upvoteItem(id) {
  await fetch(`${API_BASE}/itinerary/${id}/upvote`, { method: "POST" });
  loadItinerary();
}

async function downvoteItem(id) {
  await fetch(`http://localhost:8080/api/itinerary/${id}/downvote`, {
    method: "POST",
  });
  loadItinerary();
}

async function unlockItem(id) {
  await fetch(`http://localhost:8080/api/itinerary/${id}/unlock`, {
    method: "POST",
  });
  loadItinerary();
}

async function finalizeItem(id) {
  await fetch(`${API_BASE}/itinerary/${id}/finalize`, { method: "POST" });
  loadItinerary();
}

async function handleAddExpense(e) {
  e.preventDefault();
  const payload = {
    description: document.getElementById("expDesc").value,
    amount: parseFloat(document.getElementById("expAmt").value),
  };
  await fetch(
    `${API_BASE}/expenses/trip/${currentTrip.id}/user/${currentUser.id}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  document.getElementById("expDesc").value = "";
  document.getElementById("expAmt").value = "";
  loadExpenses();
}

async function loadExpenses() {
  try {
    const res = await fetch(`${API_BASE}/expenses/trip/${currentTrip.id}`);
    const data = await res.json();
    const expenses = Array.isArray(data) ? data : data.expenses || [];
    const totalSpent =
      data.totalSpent ?? expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const memberCount = data.memberCount ?? 1;
    const perPersonShare =
      data.perPersonShare ??
      Math.round((totalSpent / Math.max(1, memberCount)) * 100) / 100;

    document.getElementById("totalSpentText").innerText = `₹${totalSpent}`;
    document.getElementById("memberCountText").innerText = memberCount;
    document.getElementById("perPersonBadge").innerText =
      `₹${perPersonShare} / person`;

    document.getElementById("expenseList").innerHTML = expenses
      .map(
        (ex) => `
      <div class="flex justify-between py-1.5 border-b border-white/5">
        <span class="text-zinc-300"><b class="text-white">${ex.paidBy ? ex.paidBy.name : "Member"}</b>: ${ex.description}</span>
        <span class="font-bold text-emerald-400">₹${ex.amount}</span>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    document.getElementById("totalSpentText").innerText = "₹0";
    document.getElementById("memberCountText").innerText = "1";
    document.getElementById("perPersonBadge").innerText = "₹0 / person";
  }
}

async function handleSendChat(e) {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const content = input.value.trim();
  if (!content) return;

  await fetch(
    `${API_BASE}/chat/trip/${currentTrip.id}/user/${currentUser.id}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  input.value = "";
  loadChatMessages();
}

async function loadChatMessages() {
  if (!currentTrip) return;
  try {
    const res = await fetch(`${API_BASE}/chat/trip/${currentTrip.id}`);
    const msgs = await res.json();
    const box = document.getElementById("chatMessagesBox");

    if (!Array.isArray(msgs) || !msgs.length) return;
    box.innerHTML = msgs
      .map((m) => {
        const isMe = m.sender && m.sender.id === currentUser.id;
        return `
        <div class="flex flex-col ${isMe ? "items-end" : "items-start"}">
          <span class="text-[10px] text-zinc-500 mb-0.5">${m.sender ? m.sender.name : "User"}</span>
          <div class="px-3.5 py-2 rounded-2xl text-xs max-w-[80%] ${isMe ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow" : "bg-white/10 text-zinc-200"}">
            ${m.content}
          </div>
        </div>
      `;
      })
      .join("");
    box.scrollTop = box.scrollHeight;
  } catch (err) {
    console.error(err);
  }
}
