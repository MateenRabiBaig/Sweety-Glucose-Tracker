export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatDate = (date) => {
  if (!date) return "-";

  const [year, month, day] = date.slice(0, 10).split("-");
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  return parsedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};