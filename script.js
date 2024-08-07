document.getElementById('loadHeadersBtn').addEventListener('click', loadHeaders);

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
        alert('تم تحميل الحقول بنجاح!');
    }).catch(error => {
        console.error('Error loading headers:', error);
        alert('حدث خطأ أثناء تحميل الحقول!');
    });
}

document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    matchData();
});

function matchData() {
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
        const matchedData = [...data1].filter(([id]) => csv2.some(row => row[idIndex] === id));

        displayTable(header1, matchedData);

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
    matchFieldDropdown.innerHTML = '<option value="" disabled selected>يرجى اختيار حقل للمطابقة</option>';

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
