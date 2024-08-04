// تحديث اسم الملفات عند اختيارها
document.querySelectorAll('.custom-file-input').forEach(input => {
    input.addEventListener('change', function (e) {
        const fileNames = Array.from(e.target.files).map(file => file.name).join(', ');
        e.target.nextElementSibling.innerText = fileNames || 'اختر الملفات...';
    });
});

// التحقق من صحة النموذج باستخدام Bootstrap
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
                    event.preventDefault(); // منع الإرسال الافتراضي للنموذج
                    form.classList.add('was-validated');
                    processFiles(); // إظهار الجدول بعد التحقق
                }
            }, false);
        });
    }, false);
})();

function processFiles() {
    const fileInputs = document.getElementById('files');
    const files = fileInputs.files;

    if (files.length < 2) {
        alert('يرجى اختيار ملفين على الأقل.');
        return;
    }

    const filePromises = Array.from(files).map(file => readFile(file));

    Promise.all(filePromises).then(fileContents => {
        const csvs = fileContents.map(content => content.split('\n').map(row => row.split(',')));
        const headers = csvs.map(csv => csv.shift());

        if (!headers.every(header => JSON.stringify(header) === JSON.stringify(headers[0]))) {
            alert('الملفات تحتوي على رؤوس مختلفة!');
            return;
        }

        const idIndex = headers[0].indexOf('id');
        if (idIndex === -1) {
            alert('لم يتم العثور على عمود "id" في الرؤوس!');
            return;
        }

        const dataMaps = csvs.map(csv => new Map(csv.map(row => [row[idIndex], row])));
        const [data1, data2] = dataMaps;
        
        const unmatchedData1 = [...data1].filter(([id]) => !data2.has(id));
        const unmatchedData2 = [...data2].filter(([id]) => !data1.has(id));
        const unmatchedData = [...unmatchedData1, ...unmatchedData2];
        const matchedData = [...data1].filter(([id]) => data2.has(id));

        displayTable(headers[0], unmatchedData);

        setupDownloadLinks(headers[0], unmatchedData, 'unmatched');
        setupDownloadLinks(headers[0], matchedData, 'matched');
        
        document.getElementById('showUnmatchedBtn').addEventListener('click', () => displayTable(headers[0], unmatchedData));
        document.getElementById('showMatchedBtn').addEventListener('click', () => displayTable(headers[0], matchedData));

        document.getElementById('showUnmatchedBtn').style.display = 'inline-block';
        document.getElementById('showMatchedBtn').style.display = 'inline-block';

    }).catch(error => {
        console.error('Error reading files:', error);
        alert('Error processing files!');
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
