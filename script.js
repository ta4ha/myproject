let selectedHeader1;
let matchedData, unmatchedData, header1;
const itemsPerPage = 50;
let currentPage = 1;

// تحديث تسمية ملف الإدخال لعرض اسم الملف
document.querySelectorAll('.custom-file-input').forEach(input => {
    input.addEventListener('change', function (e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : 'Choose file...';
        e.target.nextElementSibling.innerText = fileName;
        populateMergeFieldDropdown(); // تعبئة القائمة المنسدلة عند اختيار ملف
    });
});

// إضافة ملف جديد
document.getElementById('addFileBtn').addEventListener('click', function () {
    const additionalFilesDiv = document.getElementById('additionalFiles');
    const newFileInput = document.createElement('div');
    newFileInput.className = 'custom-file mt-3';
    newFileInput.innerHTML = `
        <input type="file" class="custom-file-input" accept=".csv, .xlsx" required>
        <label class="custom-file-label">اختر الملف...</label>
        <div class="invalid-feedback">يرجى اختيار ملف.</div>
    `;
    additionalFilesDiv.appendChild(newFileInput);

    // إعادة تعيين الحدث لتحديث تسمية الملف الجديد
    newFileInput.querySelector('.custom-file-input').addEventListener('change', function (e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : 'Choose file...';
        e.target.nextElementSibling.innerText = fileName;
        populateMergeFieldDropdown(); // تعبئة القائمة المنسدلة عند اختيار ملف جديد
    });
});

// تعبئة القائمة المنسدلة بحقول الدمج من الملف الأول
function populateMergeFieldDropdown() {
    const file1 = document.getElementById('file1').files[0];
    if (file1) {
        readFile(file1).then(contents => {
            const csv1 = contents.split('\n').map(row => row.split(','));
            header1 = csv1.shift(); // استخراج الصف العلوي
            selectedHeader1 = header1;
            const mergeFieldDropdown = document.getElementById('mergeField');
            mergeFieldDropdown.innerHTML = '<option value="" disabled selected>اختر الحقل...</option>';
            header1.forEach(headerItem => {
                const option = document.createElement('option');
                option.value = headerItem;
                option.textContent = headerItem;
                mergeFieldDropdown.appendChild(option);
            });
            localStorage.setItem('header1', JSON.stringify(header1)); // حفظ في المتصفح
        }).catch(error => {
            console.error('Error reading file:', error);
            alert('Error processing file!');
        });
    }
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

// التحقق من صحة النموذج
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
                    processFiles(); // معالجة الملفات بعد التحقق
                }
            }, false);
        });
    }, false);
})();

function processFiles() {
    const files = Array.from(document.querySelectorAll('.custom-file-input')).map(input => input.files[0]);
    const mergeField = document.getElementById('mergeField').value;

    if (files.every(file => file) && mergeField) {
        document.getElementById('progressCard').style.display = 'block';
        updateProgress(0);

        Promise.all(files.map(file => readFile(file))).then(contents => {
            updateProgress(30);

            const csvs = contents.map(content => content.split('\n').map(row => row.split(',')));
            const headers = csvs.map(csv => csv.shift());

            const mergeFieldIndices = headers.map(header => header.indexOf(mergeField));
            if (mergeFieldIndices.some(index => index === -1)) {
                alert(`No "${mergeField}" column found in one or more headers!`);
                return;
            }

            const dataMaps = csvs.map((csv, i) => new Map(csv.map(row => [row[mergeFieldIndices[i]], row])));

            const allFields = Array.from(new Set(headers.flat()));
            setupFieldsSelection(allFields);

            matchedData = dataMaps.reduce((acc, dataMap) => {
                return acc.filter(([id]) => dataMap.has(id));
            }, [...dataMaps[0]]);

            unmatchedData = dataMaps.reduce((acc, dataMap) => {
                return acc.concat([...dataMap].filter(([id]) => !matchedData.find(matchedRow => matchedRow[0] === id)));
            }, []);

            updateProgress(70);
            document.getElementById('fieldsSelectionCard').style.display = 'block';

            document.getElementById('displayDataBtn').addEventListener('click', () => {
                const selectedFields = getSelectedFields();
                displayTable(selectedFields, matchedData, headers[0]);
                document.getElementById('dataCard').style.display = 'block';
                document.getElementById('showUnmatchedBtn').style.display = 'inline-block';
                document.getElementById('showMatchedBtn').style.display = 'inline-block';
                updateProgress(100);
            });

            document.getElementById('showUnmatchedBtn').addEventListener('click', () => {
                const selectedFields = getSelectedFields();
                displayTable(selectedFields, unmatchedData, headers[0]);
            });

            document.getElementById('showMatchedBtn').addEventListener('click', () => {
                const selectedFields = getSelectedFields();
                displayTable(selectedFields, matchedData, headers[0]);
            });

            document.getElementById('downloadCsvBtn').addEventListener('click', () => {
                downloadTableAsCsv();
            });

            document.getElementById('downloadXlsxBtn').addEventListener('click', () => {
                downloadTableAsXlsx();
            });

        }).catch(error => {
            console.error('Error reading files:', error);
            alert('Error processing files!');
        });
    }
}

function updateProgress(value) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = value + '%';
    progressBar.setAttribute('aria-valuenow', value);
}

function setupFieldsSelection(fields) {
    const fieldsCheckboxes = document.getElementById('fieldsCheckboxes');
    fieldsCheckboxes.innerHTML = '';
    fields.forEach(field => {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check';
        checkbox.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${field}" id="${field}">
            <label class="form-check-label" for="${field}">
                ${field}
            </label>
        `;
        fieldsCheckboxes.appendChild(checkbox);
    });

    document.getElementById('selectAllFields').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#fieldsCheckboxes input');
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
    });
}

function getSelectedFields() {
    const selectedFields = [];
    document.querySelectorAll('#fieldsCheckboxes input:checked').forEach(checkbox => {
        selectedFields.push(checkbox.value);
    });
    return selectedFields;
}

function displayTable(selectedFields, data, header) {
    const tableHeader = document.getElementById('tableHeader');
    tableHeader.innerHTML = '';
    const sequenceHeader = document.createElement('th');
    sequenceHeader.textContent = '#';
    tableHeader.appendChild(sequenceHeader);

    selectedFields.forEach(field => {
        const th = document.createElement('th');
        th.textContent = field;
        tableHeader.appendChild(th);
    });

    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentData = data.slice(start, end);

    currentData.forEach(([id, row], index) => {
        const tr = document.createElement('tr');
        const sequenceCell = document.createElement('td');
        sequenceCell.textContent = start + index + 1;
        tr.appendChild(sequenceCell);
        selectedFields.forEach(field => {
            const td = document.createElement('td');
            const fieldIndex = header.indexOf(field);
            td.textContent = row[fieldIndex] || ''; // التأكد من وجود البيانات
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    updatePagination(data.length);
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage = i;
            const selectedFields = getSelectedFields();
            const dataToDisplay = document.getElementById('showMatchedBtn').style.display === 'inline-block' ? matchedData : unmatchedData;
            displayTable(selectedFields, dataToDisplay, header1);
        });
        pagination.appendChild(li);
    }
}

function downloadTableAsCsv() {
    const selectedFields = getSelectedFields();
    const rows = Array.from(document.querySelectorAll('#dataTable tr')).map(row => {
        return Array.from(row.querySelectorAll('th, td')).map(cell => `"${cell.textContent}"`);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadTableAsXlsx() {
    const selectedFields = getSelectedFields();
    const rows = Array.from(document.querySelectorAll('#dataTable tr')).map(row => {
        return Array.from(row.querySelectorAll('th, td')).map(cell => cell.textContent);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "data.xlsx");
} 
