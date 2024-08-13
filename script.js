// Update the label of the file input to show the file name
document.querySelectorAll('.custom-file-input').forEach(input => {
    input.addEventListener('change', function (e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : 'Choose file...';
        e.target.nextElementSibling.innerText = fileName;
        populateMergeFieldDropdown(); // Populate dropdown when file is selected
    });
});

// Populate the merge field dropdown with column names from the first file
function populateMergeFieldDropdown() {
    const file1 = document.getElementById('file1').files[0];
    if (file1) {
        readFile(file1).then(contents => {
            const csv1 = contents.split('\n').map(row => row.split(','));
            const header1 = csv1.shift();
            const mergeFieldDropdown = document.getElementById('mergeField');
            mergeFieldDropdown.innerHTML = '<option value="" disabled selected>اختر الحقل...</option>';
            header1.forEach(headerItem => {
                const option = document.createElement('option');
                option.value = headerItem;
                option.textContent = headerItem;
                mergeFieldDropdown.appendChild(option);
            });
        }).catch(error => {
            console.error('Error reading file:', error);
            alert('Error processing file!');
        });
    }
}

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
                    processFiles(); // Show the table after validation
                }
            }, false);
        });
    }, false);
})();

function processFiles() {
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];
    const mergeField = document.getElementById('mergeField').value;

    if (file1 && file2 && mergeField) {
        Promise.all([readFile(file1), readFile(file2)]).then(contents => {
            const csv1 = contents[0].split('\n').map(row => row.split(','));
            const csv2 = contents[1].split('\n').map(row => row.split(','));

            const header1 = csv1.shift();
            const header2 = csv2.shift();

            if (JSON.stringify(header1) !== JSON.stringify(header2)) {
                alert('Files have different headers!');
                return;
            }

            const idIndex = header1.indexOf(mergeField);
            if (idIndex === -1) {
                alert(`No "${mergeField}" column found in the headers!`);
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
            alert('Error processing files!');
        });
    }
}
