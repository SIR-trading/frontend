document.documentElement.classList.toggle(
  "dark",
  localStorage.isDark === "true" ||
    (!("isDark" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches),
);
