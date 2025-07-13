
const search = document.querySelector('.input-group input'),
    table_rows = document.querySelectorAll('tbody tr'),
    table_headings = document.querySelectorAll('thead th');

// 1. Searching for specific data of HTML table
function searchTable() {
    const tableRows = document.querySelectorAll('#Date__Table tbody tr'); // Select all rows in the table body
    const searchInput = document.querySelector('.input-group input'); // The search input element
    const searchValue = searchInput.value.toLowerCase(); // Get search value in lowercase

    tableRows.forEach((row, index) => {
        const rowData = row.textContent.toLowerCase(); // Get row text content in lowercase

        // Toggle visibility based on whether the search value is found
        const matches = rowData.indexOf(searchValue) >= 0;
        row.classList.toggle('hide', !matches);

        // Set a CSS variable for delay animation (optional)
        row.style.setProperty('--delay', `${index / 25}s`);
    });

    // Style visible rows alternately
    const visibleRows = document.querySelectorAll('#Date__Table tbody tr:not(.hide)');
    visibleRows.forEach((row, index) => {
        row.style.backgroundColor = index % 2 === 0 ? 'transparent' : '#0000000b'; // Alternate row background
    });
}

// Event Listener for Search Input
document.querySelector('.input-group input').addEventListener('input', searchTable);
// Sorting | Ordering data of HTML table
document.addEventListener('DOMContentLoaded', () => {
    const tableHeadings = document.querySelectorAll('#Date__Table thead th'); // Target table headers
    let tableRows; // Declare tableRows to update dynamically after data is fetched

    // Function to update tableRows dynamically
    const updateTableRows = () => {
        tableRows = document.querySelectorAll('#Date__Table tbody tr');
    };

    // Add event listeners to all table headers
    tableHeadings.forEach((heading, columnIndex) => {
        let sortAscending = true; // Track sorting order

        heading.onclick = () => {
            // Update rows dynamically
            updateTableRows();

            // Reset styles for all headers
            tableHeadings.forEach(head => head.classList.remove('active'));
            heading.classList.add('active'); // Highlight active header

            // Remove 'active' class from all cells, then highlight the column being sorted
            document.querySelectorAll('td').forEach(cell => cell.classList.remove('active'));
            tableRows.forEach(row => {
                row.querySelectorAll('td')[columnIndex]?.classList.add('active');
            });

            // Toggle sorting direction
            heading.classList.toggle('asc', sortAscending);
            heading.classList.toggle('desc', !sortAscending);
            sortAscending = !sortAscending; // Flip the sort order

            // Call the sorting function
            sortTable(columnIndex, sortAscending);
        };
    });

    function sortTable(columnIndex, sortAscending) {
        // Update rows dynamically before sorting
        updateTableRows();

        // Convert NodeList of table rows to an array and sort
        const sortedRows = [...tableRows].sort((rowA, rowB) => {
            const cellA = rowA.querySelectorAll('td')[columnIndex].textContent.toLowerCase();
            const cellB = rowB.querySelectorAll('td')[columnIndex].textContent.toLowerCase();

            // Compare values (ascending or descending based on sortAscending)
            if (cellA < cellB) return sortAscending ? -1 : 1;
            if (cellA > cellB) return sortAscending ? 1 : -1;
            return 0;
        });

        // Append sorted rows back to the table body
        const tableBody = document.querySelector('#Date__Table tbody');
        sortedRows.forEach(row => tableBody.appendChild(row));
    }
});

// 3. Converting HTML table to PDF

const pdf_btn = document.querySelector('#toPDF');
const customers_table = document.querySelector('#customers_table');


const toPDF = function (customers_table) {
    const html_code = `
    <!DOCTYPE html>
    <link rel="stylesheet" type="text/css" href="/CSS/attendance.css">
    <main class="table" id="customers_table">${customers_table.innerHTML}</main>`;

    const new_window = window.open();
     new_window.document.write(html_code);

    setTimeout(() => {
        new_window.print();
        new_window.close();
    }, 400);
}

pdf_btn.onclick = () => {
    toPDF(customers_table);
}

// Converting HTML Table to JSON
const jsonBtn = document.querySelector('#toJSON');

const toJSON = function (table) {
    const tableData = [];
    const headers = [];

    const tableHeadings = table.querySelectorAll('th');
    const tableRows = table.querySelectorAll('tbody tr');

    // Extract table headers
    tableHeadings.forEach(heading => {
        const headerText = heading.textContent.trim().split(' ');
        headers.push(headerText.slice(0, -1).join(' ').toLowerCase());
    });

    // Extract table rows
    tableRows.forEach(row => {
        const rowData = {};
        const cells = row.querySelectorAll('td');

        cells.forEach((cell, index) => {
            const img = cell.querySelector('img');
            if (img) {
                rowData['image'] = decodeURIComponent(img.src);
            }
            rowData[headers[index]] = cell.textContent.trim();
        });

        tableData.push(rowData);
    });

    return JSON.stringify(tableData, null, 4);
};

jsonBtn.onclick = () => {
    const json = toJSON(document.querySelector('#Date__Table'));
    downloadFile(json, 'json', 'table_data.json');
};

// Converting HTML Table to CSV
const csvBtn = document.querySelector('#toCSV');

const toCSV = function (table) {
    const tableHeadings = table.querySelectorAll('th');
    const tableRows = table.querySelectorAll('tbody tr');

    // Extract headers
    const headers = [...tableHeadings]
        .map(heading => heading.textContent.trim().split(' ').slice(0, -1).join(' ').toLowerCase())
        .join(',');

    // Extract rows
    const rows = [...tableRows]
        .map(row => {
            const cells = row.querySelectorAll('td');
            return [...cells]
                .map(cell => cell.textContent.replace(/,/g, '.').trim())
                .join(',');
        })
        .join('\n');

    return `${headers}\n${rows}`;
};

csvBtn.onclick = () => {
    const csv = toCSV(document.querySelector('#Date__Table'));
    downloadFile(csv, 'csv', 'table_data.csv');
};

// Converting HTML Table to Excel
const excelBtn = document.querySelector('#toEXCEL');

const toExcel = function (table) {
    const tableHeadings = table.querySelectorAll('th');
    const tableRows = table.querySelectorAll('tbody tr');

    // Extract headers
    const headers = [...tableHeadings]
        .map(heading => heading.textContent.trim().split(' ').slice(0, -1).join(' ').toLowerCase())
        .join('\t');

    // Extract rows
    const rows = [...tableRows]
        .map(row => {
            const cells = row.querySelectorAll('td');
            return [...cells]
                .map(cell => cell.textContent.trim())
                .join('\t');
        })
        .join('\n');

    return `${headers}\n${rows}`;
};

excelBtn.onclick = () => {
    const excel = toExcel(document.querySelector('#Date__Table'));
    downloadFile(excel, 'excel', 'table_data.xlsx');
};

// Download File
const downloadFile = function (data, fileType, fileName = '') {
    const a = document.createElement('a');
    const mimeTypes = {
        json: 'application/json',
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    a.href = `data:${mimeTypes[fileType]};charset=utf-8,${encodeURIComponent(data)}`;
    a.download = fileName || `table_data.${fileType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
