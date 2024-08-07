// Update the label of the file input to show the file name
document.querySelectorAll('.custom-file-input').forEach(input => {
    input.addEventListener('change', function (e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : 'اختر الملف...';
        e.target.nextElementSibling.innerText = fileName;
    });
});

// Bootstrap validation for forms
(function() {
    'use strict';
    window.addEventListener('load', function() {
        const forms = document.getElementsByClassName('needs-validation');
        Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    event.preventDefault(); // Prevent the default form submission
                    form.classList.add('was-validated');
                    matchData(); // Match data after validation
                }
            }, false);
        });
    }, false);
})();

document.getElementById('loadHeadersBtn').addEventListener('click', loadHeaders);

let headersLoaded = false;
let globalHeaders = [];

function loadHeaders() {
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    if (!file1 || !file2) {
        alert('يرجى اختيار ملفين أولاً!');
        return;
    }

    Promise.all([readFileHeaders(file1), readFileHeaders(file2)]).then(headers => {
        if (JSON.stringify(headers[0]) !== JSON.stringify(headers[1])) {
            alert('الملفات تحتوي على رؤوس مختلفة!');
            return;
        }

        globalHeaders = headers[0];
        populateFieldDropdown(globalHeaders);
        headersLoaded = true;
        alert('تم تحميل الحقول بنجاح!');
    }).catch(error => {
        console.error('Error loading headers:', error);
        alert('حدث خطأ أثناء تحميل الحقول!');
    });
}

function matchData() {
    if (!headersLoaded) {
        alert('يرجى تحميل الحقول أولاً!');
        return;
    }

    const matchField = document.getElementById('matchField').value;
    if (!matchField) {
        alert('يرجى اختيار حقل للمطابقة!');
        return;
    }

    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    Promise.all([readFile(file1), readFile(file2)]).then(contents => {
        const csv1 = contents[0].split('\n').map(row => row.split(','));
        const csv2 = contents[1].split('\n').map(row => row.split(','));

        const header1 = csv1.shift();
        const header2 = csv2.shift();

        const idIndex = header1.indexOf(matchField);
        if (idIndex === -1) {
            alert(`لا يوجد عمود "${matchField}" في الرؤوس!`);
            return;
        }

        const data1 = new Map(csv1.map(row => [row[idIndex], row]));
        const data2 = new Map(csv2.map(row => [row[idIndex], row]));

        const unmatchedData1 = [...data1].filter(([id]) => !data2.has(id));
        const unmatchedData2 = [...data2].filter(([id]) => !data1.has(id));
        const unmatchedData = [...unmatchedData1, ...unmatchedData2];
        const matchedData = [...data1].filter(([id]) => data2.has(id));

        displayTable(header1, unmatchedData);

        setupDownloadLinks(header1, unmatchedData, 'unmatched');
        setupDownloadLinks(header1, matchedData, 'matched');
        
        document.getElementById('showUnmatchedBtn').addEventListener('click', () => displayTable(header1, unmatchedData));
        document.getElementById('showMatchedBtn').addEventListener('click', () => displayTable(header1, matchedData));

        document.getElementById('showUnmatchedBtn').style.display = 'inline-block';
        document.getElementById('showMatchedBtn').style.display = 'inline-block';

        document.getElementById('dataCard').style.display = 'block';

    }).catch(error => {
        console.error('Error reading files:', error);
        alert('حدث خطأ أثناء معالجة الملفات!');
    });
}

function readFileHeaders(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            const headers = csv.split('\n')[0].split(',');
            resolve(headers);
        };
        reader.onerror = function(event) {
            reject(event);
        };
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
            reader.readAsArrayBuffer(file);
        }
    });
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            resolve(csv);
        };
        reader.onerror = function(event) {
            reject(event);
        };
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
            reader.readAsArrayBuffer(file);
        }
    });
}

function populateFieldDropdown(headers) {
    const matchFieldDropdown = document.getElementById('matchField');
    matchFieldDropdown.innerHTML = '';

    headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        matchFieldDropdown.appendChild(option);
    });
}

function displayTable(header, data) {
    const tableHeader = document.getElementById('tableHeader');
    tableHeader.innerHTML = '';
    const sequenceHeader = document.createElement('th');
    sequenceHeader.textContent = '#';
    tableHeader.appendChild(sequenceHeader);
    header.forEach(headerItem => {
        const th = document.createElement('th');
        th.textContent = headerItem;
        tableHeader.appendChild(th);
    });

    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    data.forEach(([id, row], index) => {
        const tr = document.createElement('tr');
        const sequenceCell = document.createElement('td');
        sequenceCell.textContent = index + 1;
        tr.appendChild(sequenceCell);
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    document.getElementById('dataTable').style.display = 'table';
}

function setupDownloadLinks(header, data, type) {
    const resultCsv = [header, ...data.map(([id, row]) => row)]
        .map(row => row.join(',')).join('\n');

    const blob = new Blob([new TextEncoder().encode(resultCsv)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    if (type === 'unmatched') {
        const downloadUnmatchedCsvLink = document.getElementById('downloadUnmatchedCsvLink');
        downloadUnmatchedCsvLink.href = url;
        downloadUnmatchedCsvLink.download = `unmatched_data.csv`;
        downloadUnmatchedCsvLink.style.display = 'block';
        
        const wsUnmatched = XLSX.utils.aoa_to_sheet([header, ...data.map(([id, row]) => row)]);
        const wbUnmatched = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbUnmatched, wsUnmatched, "Sheet1");
        const xlsxBlobUnmatched = new Blob([XLSX.write(wbUnmatched, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' });
        const xlsxUrlUnmatched = URL.createObjectURL(xlsxBlobUnmatched);

        const downloadUnmatchedXlsxLink = document.getElementById('downloadUnmatchedXlsxLink');
        downloadUnmatchedXlsxLink.href = xlsxUrlUnmatched;
        downloadUnmatchedXlsxLink.download = `unmatched_data.xlsx`;
        downloadUnmatchedXlsxLink.style.display = 'block';
    } else if (type === 'matched') {
        const downloadMatchedCsvLink = document.getElementById('downloadMatchedCsvLink');
        downloadMatchedCsvLink.href = url;
        downloadMatchedCsvLink.download = `matched_data.csv`;
        downloadMatchedCsvLink.style.display = 'block';

        const wsMatched = XLSX.utils.aoa_to_sheet([header, ...data.map(([id, row]) => row)]);
        const wbMatched = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbMatched, wsMatched, "Sheet1");
        const xlsxBlobMatched = new Blob([XLSX.write(wbMatched, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' });
        const xlsxUrlMatched = URL.createObjectURL(xlsxBlobMatched);

        const downloadMatchedXlsxLink = document.getElementById('downloadMatchedXlsxLink');
        downloadMatchedXlsxLink.href = xlsxUrlMatched;
        downloadMatchedXlsxLink.download = `matched_data.xlsx`;
        downloadMatchedXlsxLink.style.display = 'block';
    }
}
