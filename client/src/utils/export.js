
/**
 * Export data to CSV file
 * @param {Array<Array<string|number>>} data - Array of rows, where each row is an array of values
 * @param {string} filename - Name of the file to download
 */
export function exportToCSV(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export data to JSON file
 * @param {Object|Array} data - Data to export
 * @param {string} filename - Name of the file to download
 */
export function exportToJSON(data, filename) {
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
