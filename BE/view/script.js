const searchInput = document.getElementById("search");
const userCards = document.getElementById("userCards");
const loading = document.getElementById("loading");

let timeout = null;

searchInput.addEventListener("input", () => {
  clearTimeout(timeout);
  const query = searchInput.value.trim(); // ✅ query động, update theo input

  timeout = setTimeout(() => {
    if (query === "") {
      userCards.innerHTML = "";
      return;
    }

    loading.style.display = "block";

    // ✅ Dùng query thay vì biến keyword bị lỗi
    fetch(
      "http://localhost:3000/api/products/search?keyword=" +
        encodeURIComponent(query)
    )
      .then((res) => res.json())
      .then((data) => {
        loading.style.display = "none";
        userCards.innerHTML = "";

        if (!data || data.length === 0) {
          userCards.innerHTML = `<div class="card"><div class="header">No products found</div></div>`;
          return;
        }

        data.forEach((product) => {
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <div class="header">${product.name}</div>
            <div class="body">${product.description || "No description"}</div>
          `;
          userCards.appendChild(card);
        });
      })
      .catch((err) => {
        loading.style.display = "none";
        userCards.innerHTML = `<div class="card"><div class="header">Error loading data</div></div>`;
        console.error("Fetch error:", err);
      });
  }, 300);
});
