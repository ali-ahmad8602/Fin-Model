/**
 * LocalStorage Data Export Utility
 * Run this in browser console before migration to save existing data
 */

export function exportLocalStorageData() {
    const funds = localStorage.getItem('funds');
    const loans = localStorage.getItem('loans');

    const exportData = {
        exportDate: new Date().toISOString(),
        funds: funds ? JSON.parse(funds) : [],
        loans: loans ? JSON.parse(loans) : []
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `fin-model-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Data exported successfully!');
    console.log(`Funds: ${exportData.funds.length}, Loans: ${exportData.loans.length}`);
}

// Auto-run on page load if needed
if (typeof window !== 'undefined') {
    (window as any).exportLocalStorageData = exportLocalStorageData;
    console.log('📦 Data export utility loaded. Run exportLocalStorageData() to backup your data.');
}
