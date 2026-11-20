export const TIME_SLOTS = [
    "Morning (fasting)",
    "After breakfast",
    "After lunch",
    "After dinner"
];

export const validateReading = ({ date, slot, value }) => {
    if(value === undefined || value === null || value === "") {
        return "Please enter a glucose value.";
    }
    const numericValue = Number(value);

    if(!Number.isInteger(numericValue) || numericValue<40 || numericValue>600) {
        return "Value must be between 40 and 600 mg/dl.";
    }

    if(!date) {
        return "Please select a date.";
    }

    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return "Please enter a valid date.";
    }

    const [year, month, day] = date.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month-1, day));

    if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) {
        return "Please enter a valid date.";
    }

    const today = new Date();
    const todayString = [today.getFullYear(), String(today.getMonth()+1).padStart(2,"0"), String(today.getDate()).padStart(2,"0")].join("-");

    if(date>todayString) {
        return "Date cannot be in future.";
    }

    if(!TIME_SLOTS.includes(slot)) {
        return "Please select a valid slot.";
    }

    return null;
}