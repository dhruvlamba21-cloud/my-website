document.getElementById("year").textContent = new Date().getFullYear();

const links = document.querySelectorAll('a[href^="#"]');

links.forEach(link => {
    link.addEventListener("click", () => {
        document.body.classList.add("navigating");
        setTimeout(() => document.body.classList.remove("navigating"), 300);
    });
});
