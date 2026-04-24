
/**
 * Export data to CSV file
 * @param {Array<Array<string|number>>} data - Array of rows, where each row is an array of values
 * @param {string} filename - Name of the file to download
 */
export function exportToCSV(data, filename) {
    // Convert to CSV string with sanitization
    const csvRows = data.map(row => 
        row.map(value => {
            const strValue = String(value || '');
            // Escape quotes and wrap in quotes if it contains commas or newlines
            const escaped = strValue.replace(/"/g, '""');
            return (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) 
                ? `"${escaped}"` 
                : escaped;
        }).join(",")
    );
    
    const csvString = csvRows.join("\n");
    
    // Create blob with UTF-8 BOM for Excel compatibility
    const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
